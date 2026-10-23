package com.potato.service;

import com.potato.dto.OrderDtos.OrderDto;
import com.potato.entity.Order;
import com.potato.entity.OrderPriority;
import com.potato.entity.OrderStatus;
import com.potato.repository.OrderRepository;
import com.potato.repository.OrderStatusEventRepository;
import com.potato.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KitchenQueueConcurrencyTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderStatusEventRepository statusEventRepository;
    @Mock
    private OutboxEventRepository outboxEventRepository;
    @Mock
    private OrderService orderService;

    private KitchenQueueService queueService;

    @BeforeEach
    void setUp() {
        queueService = new KitchenQueueService(orderRepository, statusEventRepository, outboxEventRepository, orderService);
    }

    @Test
    @DisplayName("Concurrent kitchen staff claims do not double claim the same order")
    void testConcurrentProcessNextClaimsDistinctOrders() throws Exception {
        Order order1 = new Order();
        order1.setId(UUID.randomUUID());
        order1.setOrderNumber("ORD-CONCUR-1");
        order1.setStatus(OrderStatus.QUEUED);
        order1.setPriority(OrderPriority.EXPRESS);
        order1.setQueuedAt(Instant.now().minusSeconds(10));

        Order order2 = new Order();
        order2.setId(UUID.randomUUID());
        order2.setOrderNumber("ORD-CONCUR-2");
        order2.setStatus(OrderStatus.QUEUED);
        order2.setPriority(OrderPriority.REGULAR);
        order2.setQueuedAt(Instant.now().minusSeconds(5));

        // Queue with 2 orders
        Queue<Order> queue = new ConcurrentLinkedQueue<>(List.of(order1, order2));

        when(orderRepository.claimNextEligibleOrderSkipLocked()).thenAnswer(inv -> Optional.ofNullable(queue.poll()));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderService.toDto(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            return new OrderDto(
                o.getId(), o.getOrderNumber(), UUID.randomUUID(), "Spud Kitchen",
                null, o.getStatus(), o.getPriority(), o.getPriorityRank(), o.getQueuedAt(),
                o.getClaimedAt(), null, java.math.BigDecimal.TEN, java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO, java.math.BigDecimal.TEN, com.potato.entity.PaymentStatus.PAID,
                "ref", List.of(), List.of(), Instant.now()
            );
        });

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<OrderDto> claimedOrders = Collections.synchronizedList(new ArrayList<>());
        AtomicInteger failures = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            UUID staffId = UUID.randomUUID();
            executor.submit(() -> {
                try {
                    startLatch.await();
                    OrderDto claimed = queueService.processNext(staffId);
                    claimedOrders.add(claimed);
                } catch (Exception e) {
                    failures.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(failures.get()).isEqualTo(0);
        assertThat(claimedOrders).hasSize(2);
        // Verify orders are distinct
        Set<String> orderNumbers = new HashSet<>();
        for (OrderDto o : claimedOrders) {
            orderNumbers.add(o.orderNumber());
            assertThat(o.status()).isEqualTo(OrderStatus.CLAIMED);
        }
        assertThat(orderNumbers).containsExactlyInAnyOrder("ORD-CONCUR-1", "ORD-CONCUR-2");
    }
}
