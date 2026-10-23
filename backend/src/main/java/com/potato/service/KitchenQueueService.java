package com.potato.service;

import com.potato.dto.OrderDtos.*;
import com.potato.entity.Order;
import com.potato.entity.OrderPriority;
import com.potato.entity.OrderStatus;
import com.potato.entity.OrderStatusEvent;
import com.potato.entity.OutboxEvent;
import com.potato.exception.InvalidStatusTransitionException;
import com.potato.exception.QueueEmptyException;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.OrderRepository;
import com.potato.repository.OrderStatusEventRepository;
import com.potato.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Service
public class KitchenQueueService {

    private static final Logger log = LoggerFactory.getLogger(KitchenQueueService.class);

    private final OrderRepository orderRepository;
    private final OrderStatusEventRepository statusEventRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final OrderService orderService;
    private final ReentrantLock memoryLock = new ReentrantLock();

    public KitchenQueueService(
        OrderRepository orderRepository,
        OrderStatusEventRepository statusEventRepository,
        OutboxEventRepository outboxEventRepository,
        OrderService orderService
    ) {
        this.orderRepository = orderRepository;
        this.statusEventRepository = statusEventRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.orderService = orderService;
    }

    @Transactional(readOnly = true)
    public List<QueueOrderSummaryDto> getPendingQueue() {
        List<Order> queuedOrders = orderRepository.findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED);
        Instant now = Instant.now();
        return queuedOrders.stream()
            .map(o -> toSummaryDto(o, now))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<QueueOrderSummaryDto> peekNext() {
        return orderRepository.findFirstByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED)
            .map(o -> toSummaryDto(o, Instant.now()));
    }

    @Transactional(readOnly = true)
    public boolean isQueueEmpty() {
        return orderRepository.countByStatus(OrderStatus.QUEUED) == 0;
    }

    @Transactional(readOnly = true)
    public QueueStatusDto getQueueStatus() {
        List<QueueOrderSummaryDto> pending = getPendingQueue();
        long expressCount = pending.stream().filter(p -> p.priority() == OrderPriority.EXPRESS).count();
        long regularCount = pending.stream().filter(p -> p.priority() == OrderPriority.REGULAR).count();
        QueueOrderSummaryDto nextEligible = pending.isEmpty() ? null : pending.get(0);

        return new QueueStatusDto(
            pending.size(),
            expressCount,
            regularCount,
            nextEligible,
            pending
        );
    }

    @Transactional
    public OrderDto processNext(UUID staffUserId) {
        memoryLock.lock();
        try {
            Order order = null;
            try {
                // Production: PostgreSQL row-level lock SKIP LOCKED
                Optional<Order> lockedOrder = orderRepository.claimNextEligibleOrderSkipLocked();
                if (lockedOrder.isPresent()) {
                    order = lockedOrder.get();
                }
            } catch (Exception e) {
                log.debug("Native FOR UPDATE SKIP LOCKED not supported by dialect, falling back to JPA query: {}", e.getMessage());
            }

            if (order == null) {
                // Fallback for H2 / unit tests
                order = orderRepository.findFirstByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED)
                    .orElseThrow(() -> new QueueEmptyException("No orders are currently waiting in the kitchen queue"));
            }

            OrderStatus previousStatus = order.getStatus();
            order.setStatus(OrderStatus.CLAIMED);
            order.setClaimedAt(Instant.now());
            Order savedOrder = orderRepository.save(order);

            OrderStatusEvent statusEvent = new OrderStatusEvent(
                savedOrder,
                previousStatus,
                OrderStatus.CLAIMED,
                staffUserId,
                "Order claimed by kitchen staff and moved into prep"
            );
            statusEventRepository.save(statusEvent);
            savedOrder.getStatusEvents().add(statusEvent);

            outboxEventRepository.save(new OutboxEvent(
                "ORDER_CLAIMED",
                savedOrder.getId(),
                "{\"orderId\":\"" + savedOrder.getId() + "\",\"claimedAt\":\"" + savedOrder.getClaimedAt() + "\"}"
            ));

            log.info("Order {} ({}) claimed by staff {}", savedOrder.getOrderNumber(), savedOrder.getPriority(), staffUserId);
            return orderService.toDto(savedOrder);
        } finally {
            memoryLock.unlock();
        }
    }

    @Transactional
    public OrderDto updateOrderStatus(UUID orderId, OrderStatus newStatus, String note, UUID staffUserId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new InvalidStatusTransitionException(
                "Cannot transition order from " + order.getStatus() + " to " + newStatus
            );
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.CANCELLED) {
            order.setCompletedAt(Instant.now());
        }

        Order savedOrder = orderRepository.save(order);

        String auditNote = (note != null && !note.trim().isEmpty())
            ? note.trim()
            : "Status updated to " + newStatus;

        OrderStatusEvent statusEvent = new OrderStatusEvent(
            savedOrder,
            previousStatus,
            newStatus,
            staffUserId,
            auditNote
        );
        statusEventRepository.save(statusEvent);
        savedOrder.getStatusEvents().add(statusEvent);

        outboxEventRepository.save(new OutboxEvent(
            "ORDER_STATUS_CHANGED",
            savedOrder.getId(),
            "{\"orderId\":\"" + savedOrder.getId() + "\",\"from\":\"" + previousStatus + "\",\"to\":\"" + newStatus + "\"}"
        ));

        log.info("Order {} transitioned from {} to {}", savedOrder.getOrderNumber(), previousStatus, newStatus);
        return orderService.toDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getRecentOrders(int limit) {
        int max = Math.min(Math.max(limit, 1), 50);
        List<OrderStatus> nonQueuedStatuses = List.of(
            OrderStatus.CLAIMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.DISPATCHED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED
        );

        return orderRepository.findByStatusInOrderByUpdatedAtDesc(nonQueuedStatuses, PageRequest.of(0, max))
            .getContent()
            .stream()
            .map(orderService::toDto)
            .collect(Collectors.toList());
    }

    private QueueOrderSummaryDto toSummaryDto(Order order, Instant now) {
        long waitMinutes = Duration.between(order.getQueuedAt(), now).toMinutes();
        int itemCount = order.getItems().stream().mapToInt(com.potato.entity.OrderItem::getQuantity).sum();

        return new QueueOrderSummaryDto(
            order.getId(),
            order.getOrderNumber(),
            order.getRestaurant().getName(),
            order.getAddressRecipientName(),
            itemCount,
            order.getPriority(),
            order.getPriorityRank(),
            order.getStatus(),
            order.getQueuedAt(),
            Math.max(waitMinutes, 0)
        );
    }
}
