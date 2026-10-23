package com.potato.service;

import com.potato.dto.OrderDtos.*;
import com.potato.entity.*;
import com.potato.exception.InvalidStatusTransitionException;
import com.potato.exception.QueueEmptyException;
import com.potato.repository.OrderRepository;
import com.potato.repository.OrderStatusEventRepository;
import com.potato.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KitchenQueueServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusEventRepository statusEventRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private OrderService orderService;

    private KitchenQueueService queueService;

    private Restaurant mockRestaurant;
    private User mockUser;

    @BeforeEach
    void setUp() {
        queueService = new KitchenQueueService(orderRepository, statusEventRepository, outboxEventRepository, orderService);

        mockRestaurant = new Restaurant("The Spud", "spud", "Desc", "Comfort", "img", BigDecimal.valueOf(3.0), 20, 30);
        mockRestaurant.setId(UUID.randomUUID());

        mockUser = new User("Jane Customer", "jane@example.com", "hash", Role.CUSTOMER);
        mockUser.setId(UUID.randomUUID());
    }

    private Order createTestOrder(String orderNum, OrderPriority priority, Instant queuedAt) {
        Order o = new Order();
        o.setId(UUID.randomUUID());
        o.setOrderNumber(orderNum);
        o.setUser(mockUser);
        o.setRestaurant(mockRestaurant);
        o.setPriority(priority);
        o.setStatus(OrderStatus.QUEUED);
        o.setQueuedAt(queuedAt);
        o.setSubtotal(BigDecimal.valueOf(20.00));
        o.setDeliveryFee(BigDecimal.valueOf(3.00));
        o.setTax(BigDecimal.valueOf(1.65));
        o.setTotal(BigDecimal.valueOf(24.65));
        o.setAddressRecipientName("Jane Customer");
        o.setAddressPhone("555-1234");
        o.setAddressLine1("123 Elm St");
        o.setAddressCity("Springfield");
        o.setAddressState("OR");
        o.setAddressPostalCode("97477");
        return o;
    }

    @Test
    @DisplayName("peekNext() on empty queue returns empty Optional without mutating state")
    void testPeekEmptyQueue() {
        when(orderRepository.findFirstByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED))
            .thenReturn(Optional.empty());

        Optional<QueueOrderSummaryDto> peek = queueService.peekNext();
        assertThat(peek).isEmpty();
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processNext() on empty queue throws QueueEmptyException (409)")
    void testProcessNextEmptyQueueThrows() {
        when(orderRepository.claimNextEligibleOrderSkipLocked()).thenReturn(Optional.empty());
        when(orderRepository.findFirstByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> queueService.processNext(UUID.randomUUID()))
            .isInstanceOf(QueueEmptyException.class)
            .hasMessageContaining("No orders are currently waiting");
    }

    @Test
    @DisplayName("Express order (rank 1) wins over earlier Regular order (rank 2)")
    void testExpressBeatsRegularEvenIfRegularQueuedEarlier() {
        Instant t0 = Instant.now().minusSeconds(600); // 10 mins ago
        Instant t1 = Instant.now().minusSeconds(100); // 1.6 mins ago

        Order regularOrder = createTestOrder("REG-001", OrderPriority.REGULAR, t0);
        Order expressOrder = createTestOrder("EXP-001", OrderPriority.EXPRESS, t1);

        // Simulated priority/FIFO queue return
        when(orderRepository.findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED))
            .thenReturn(List.of(expressOrder, regularOrder));

        List<QueueOrderSummaryDto> queue = queueService.getPendingQueue();

        assertThat(queue).hasSize(2);
        assertThat(queue.get(0).orderNumber()).isEqualTo("EXP-001");
        assertThat(queue.get(0).priority()).isEqualTo(OrderPriority.EXPRESS);
        assertThat(queue.get(1).orderNumber()).isEqualTo("REG-001");
        assertThat(queue.get(1).priority()).isEqualTo(OrderPriority.REGULAR);
    }

    @Test
    @DisplayName("Same-priority regular orders preserve strict FIFO arrival ordering")
    void testSamePriorityPreservesFifo() {
        Instant t0 = Instant.now().minusSeconds(300);
        Instant t1 = Instant.now().minusSeconds(150);

        Order reg1 = createTestOrder("REG-EARLY", OrderPriority.REGULAR, t0);
        Order reg2 = createTestOrder("REG-LATE", OrderPriority.REGULAR, t1);

        when(orderRepository.findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED))
            .thenReturn(List.of(reg1, reg2));

        List<QueueOrderSummaryDto> queue = queueService.getPendingQueue();

        assertThat(queue.get(0).orderNumber()).isEqualTo("REG-EARLY");
        assertThat(queue.get(1).orderNumber()).isEqualTo("REG-LATE");
    }

    @Test
    @DisplayName("processNext() atomically updates order to CLAIMED and records status event")
    void testProcessNextClaimsOrder() {
        Order order = createTestOrder("ORD-100", OrderPriority.EXPRESS, Instant.now());
        UUID staffId = UUID.randomUUID();

        when(orderRepository.claimNextEligibleOrderSkipLocked()).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderDto mockDto = new OrderDto(
            order.getId(), order.getOrderNumber(), mockRestaurant.getId(), mockRestaurant.getName(),
            null, OrderStatus.CLAIMED, OrderPriority.EXPRESS, 1, order.getQueuedAt(), Instant.now(), null,
            order.getSubtotal(), order.getDeliveryFee(), order.getTax(), order.getTotal(),
            PaymentStatus.PAID, "ref", List.of(), List.of(), Instant.now()
        );
        when(orderService.toDto(any(Order.class))).thenReturn(mockDto);

        OrderDto result = queueService.processNext(staffId);

        assertThat(result.status()).isEqualTo(OrderStatus.CLAIMED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CLAIMED);
        assertThat(order.getClaimedAt()).isNotNull();
        verify(statusEventRepository).save(any(OrderStatusEvent.class));
        verify(outboxEventRepository).save(any(OutboxEvent.class));
    }

    @Test
    @DisplayName("updateOrderStatus() rejects invalid transitions (e.g. CLAIMED -> DELIVERED directly)")
    void testInvalidStatusTransitionRejected() {
        Order order = createTestOrder("ORD-200", OrderPriority.REGULAR, Instant.now());
        order.setStatus(OrderStatus.CLAIMED);

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> queueService.updateOrderStatus(order.getId(), OrderStatus.DELIVERED, null, UUID.randomUUID()))
            .isInstanceOf(InvalidStatusTransitionException.class)
            .hasMessageContaining("Cannot transition order from CLAIMED to DELIVERED");
    }

    @Test
    @DisplayName("updateOrderStatus() allows valid transition (CLAIMED -> PREPARING)")
    void testValidStatusTransitionAccepted() {
        Order order = createTestOrder("ORD-200", OrderPriority.REGULAR, Instant.now());
        order.setStatus(OrderStatus.CLAIMED);

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderDto mockDto = new OrderDto(
            order.getId(), order.getOrderNumber(), mockRestaurant.getId(), mockRestaurant.getName(),
            null, OrderStatus.PREPARING, OrderPriority.REGULAR, 2, order.getQueuedAt(), Instant.now(), null,
            order.getSubtotal(), order.getDeliveryFee(), order.getTax(), order.getTotal(),
            PaymentStatus.PAID, "ref", List.of(), List.of(), Instant.now()
        );
        when(orderService.toDto(any(Order.class))).thenReturn(mockDto);

        OrderDto result = queueService.updateOrderStatus(order.getId(), OrderStatus.PREPARING, "Cooking", UUID.randomUUID());

        assertThat(result.status()).isEqualTo(OrderStatus.PREPARING);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PREPARING);
        verify(statusEventRepository).save(any(OrderStatusEvent.class));
    }
}
