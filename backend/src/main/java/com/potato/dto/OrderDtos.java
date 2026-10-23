package com.potato.dto;

import com.potato.entity.OrderPriority;
import com.potato.entity.OrderStatus;
import com.potato.entity.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OrderDtos {

    public record CheckoutAddress(
        @NotBlank(message = "Recipient name is required") String recipientName,
        @NotBlank(message = "Phone number is required") String phone,
        @NotBlank(message = "Street address is required") String streetLine1,
        String streetLine2,
        @NotBlank(message = "City is required") String city,
        @NotBlank(message = "State is required") String state,
        @NotBlank(message = "Postal code is required") String postalCode,
        String deliveryInstructions
    ) {}

    public record CheckoutRequest(
        @NotNull(message = "Restaurant ID is required")
        UUID restaurantId,

        @Valid
        @NotNull(message = "Delivery address is required")
        CheckoutAddress deliveryAddress,

        @NotNull(message = "Order priority is required (REGULAR or EXPRESS)")
        OrderPriority priority,

        @NotBlank(message = "Idempotency key is required")
        String idempotencyKey,

        @NotBlank(message = "Demo payment reference is required")
        String demoPaymentReference
    ) {}

    public record OrderItemDto(
        UUID id,
        UUID menuItemId,
        String itemName,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
    ) {}

    public record OrderStatusEventDto(
        UUID id,
        OrderStatus fromStatus,
        OrderStatus toStatus,
        UUID actorUserId,
        String note,
        Instant createdAt
    ) {}

    public record OrderDto(
        UUID id,
        String orderNumber,
        UUID restaurantId,
        String restaurantName,
        CheckoutAddress address,
        OrderStatus status,
        OrderPriority priority,
        int priorityRank,
        Instant queuedAt,
        Instant claimedAt,
        Instant completedAt,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal tax,
        BigDecimal total,
        PaymentStatus paymentStatus,
        String paymentReference,
        List<OrderItemDto> items,
        List<OrderStatusEventDto> statusEvents,
        Instant createdAt
    ) {}

    public record UpdateOrderStatusRequest(
        @NotNull(message = "Target status is required")
        OrderStatus status,
        String note
    ) {}

    public record QueueOrderSummaryDto(
        UUID id,
        String orderNumber,
        String restaurantName,
        String recipientName,
        int itemCount,
        OrderPriority priority,
        int priorityRank,
        OrderStatus status,
        Instant queuedAt,
        long waitMinutes
    ) {}

    public record QueueStatusDto(
        long totalPending,
        long expressPending,
        long regularPending,
        QueueOrderSummaryDto nextEligibleOrder,
        List<QueueOrderSummaryDto> queueBacklog
    ) {}

    public record AdminDashboardMetricsDto(
        long totalOrders,
        long pendingQueueSize,
        long expressQueueSize,
        long activeRestaurants,
        long totalCustomers,
        BigDecimal totalRevenue
    ) {}
}
