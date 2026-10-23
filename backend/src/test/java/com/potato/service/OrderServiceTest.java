package com.potato.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.potato.dto.OrderDtos.*;
import com.potato.entity.*;
import com.potato.exception.ConflictException;
import com.potato.exception.ForbiddenException;
import com.potato.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderStatusEventRepository statusEventRepository;
    @Mock
    private OutboxEventRepository outboxEventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RestaurantRepository restaurantRepository;
    @Mock
    private CartService cartService;

    private OrderService orderService;
    private final BigDecimal taxRate = new BigDecimal("0.0825");

    private User customer;
    private Restaurant restaurant;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
            orderRepository, orderItemRepository, statusEventRepository, outboxEventRepository,
            userRepository, restaurantRepository, cartService, new ObjectMapper(), taxRate
        );

        customer = new User("Alice", "alice@example.com", "hash", Role.CUSTOMER);
        customer.setId(UUID.randomUUID());

        restaurant = new Restaurant("Rustic Spud", "spud", "Desc", "Comfort", "img", new BigDecimal("3.50"), 20, 30);
        restaurant.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("checkout() idempotency key returns existing order without duplicate insertion")
    void testCheckoutIdempotency() {
        CheckoutAddress addr = new CheckoutAddress("Alice", "555-1234", "123 Main", "", "City", "ST", "12345", "");
        CheckoutRequest req = new CheckoutRequest(restaurant.getId(), addr, OrderPriority.REGULAR, "IDEM-KEY-999", "DEMO-PAY");

        Order existingOrder = new Order();
        existingOrder.setId(UUID.randomUUID());
        existingOrder.setOrderNumber("POT-20261022-1000");
        existingOrder.setIdempotencyKey("IDEM-KEY-999");
        existingOrder.setUser(customer);
        existingOrder.setRestaurant(restaurant);
        existingOrder.setSubtotal(new BigDecimal("20.00"));
        existingOrder.setDeliveryFee(new BigDecimal("3.50"));
        existingOrder.setTax(new BigDecimal("1.65"));
        existingOrder.setTotal(new BigDecimal("25.15"));
        existingOrder.setAddressRecipientName("Alice");
        existingOrder.setAddressPhone("555-1234");
        existingOrder.setAddressLine1("123 Main");
        existingOrder.setAddressCity("City");
        existingOrder.setAddressState("ST");
        existingOrder.setAddressPostalCode("12345");

        when(orderRepository.findByIdempotencyKey("IDEM-KEY-999")).thenReturn(Optional.of(existingOrder));

        OrderDto dto = orderService.checkout(customer.getId(), req);

        assertThat(dto.orderNumber()).isEqualTo("POT-20261022-1000");
        verify(orderRepository, never()).save(any());
        verify(cartService, never()).clearCart(any());
    }

    @Test
    @DisplayName("checkout() calculates subtotal, tax (8.25%), delivery fee, and total via Decimal")
    void testCheckoutCalculations() {
        CheckoutAddress addr = new CheckoutAddress("Alice", "555-1234", "123 Main", "", "City", "ST", "12345", "");
        CheckoutRequest req = new CheckoutRequest(restaurant.getId(), addr, OrderPriority.EXPRESS, "NEW-IDEM-001", "DEMO-PAY");

        MenuItem item1 = new MenuItem(restaurant, null, "Item 1", "Desc", new BigDecimal("10.00"), "img", true, false);
        item1.setId(UUID.randomUUID());
        MenuItem item2 = new MenuItem(restaurant, null, "Item 2", "Desc", new BigDecimal("15.50"), "img", true, false);
        item2.setId(UUID.randomUUID());

        Cart cart = new Cart(customer);
        cart.setRestaurant(restaurant);
        cart.getItems().add(new CartItem(cart, item1, 2)); // 2 * 10.00 = 20.00
        cart.getItems().add(new CartItem(cart, item2, 1)); // 1 * 15.50 = 15.50
        // Expected subtotal: 35.50
        // Expected delivery: 3.50
        // Expected tax: 35.50 * 0.0825 = 2.92875 -> 2.93
        // Expected total: 35.50 + 3.50 + 2.93 = 41.93

        when(orderRepository.findByIdempotencyKey("NEW-IDEM-001")).thenReturn(Optional.empty());
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(cartService.getOrCreateCart(customer.getId())).thenReturn(cart);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });

        OrderDto result = orderService.checkout(customer.getId(), req);

        assertThat(result.subtotal()).isEqualByComparingTo(new BigDecimal("35.50"));
        assertThat(result.deliveryFee()).isEqualByComparingTo(new BigDecimal("3.50"));
        assertThat(result.tax()).isEqualByComparingTo(new BigDecimal("2.93"));
        assertThat(result.total()).isEqualByComparingTo(new BigDecimal("41.93"));
        assertThat(result.priority()).isEqualTo(OrderPriority.EXPRESS);
        assertThat(result.priorityRank()).isEqualTo(1);

        verify(orderRepository).save(any(Order.class));
        verify(statusEventRepository).save(any(OrderStatusEvent.class));
        verify(outboxEventRepository).save(any(OutboxEvent.class));
        verify(cartService).clearCart(customer.getId());
    }

    @Test
    @DisplayName("getOrderById() prevents User A from accessing User B's order")
    void testUserCannotAccessOtherUserOrder() {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setUser(customer);

        UUID otherUserId = UUID.randomUUID();

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrderById(order.getId(), otherUserId, false))
            .isInstanceOf(ForbiddenException.class)
            .hasMessageContaining("do not have access");
    }

    @Test
    @DisplayName("cancelOrder() on an already claimed order throws ConflictException")
    void testCancelClaimedOrderThrows() {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setUser(customer);
        order.setStatus(OrderStatus.CLAIMED);

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(order.getId(), customer.getId(), false))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("cannot be cancelled because it is already claimed");
    }
}
