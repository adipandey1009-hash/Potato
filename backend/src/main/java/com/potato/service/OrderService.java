package com.potato.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.potato.dto.OrderDtos.*;
import com.potato.entity.*;
import com.potato.exception.BadRequestException;
import com.potato.exception.ConflictException;
import com.potato.exception.ForbiddenException;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusEventRepository statusEventRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final CartService cartService;
    private final ObjectMapper objectMapper;
    private final BigDecimal taxRate;

    public OrderService(
        OrderRepository orderRepository,
        OrderItemRepository orderItemRepository,
        OrderStatusEventRepository statusEventRepository,
        OutboxEventRepository outboxEventRepository,
        UserRepository userRepository,
        RestaurantRepository restaurantRepository,
        CartService cartService,
        ObjectMapper objectMapper,
        @Value("${potato.finance.tax-rate:0.0825}") BigDecimal taxRate
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusEventRepository = statusEventRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.cartService = cartService;
        this.objectMapper = objectMapper;
        this.taxRate = taxRate;
    }

    @Transactional
    public OrderDto checkout(UUID userId, CheckoutRequest req) {
        // 1. Idempotency Check
        Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(req.idempotencyKey());
        if (existingOrder.isPresent()) {
            return toDto(existingOrder.get());
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartService.getOrCreateCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        if (cart.getRestaurant() == null || !cart.getRestaurant().getId().equals(req.restaurantId())) {
            throw new BadRequestException("Cart contents do not match the requested restaurant");
        }

        Restaurant restaurant = cart.getRestaurant();
        if (!restaurant.isActive() || restaurant.isDeleted()) {
            throw new BadRequestException("Restaurant is currently unavailable");
        }

        // 2. Calculate totals on server using BigDecimal
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = new Order();
        order.setUser(user);
        order.setRestaurant(restaurant);
        order.setOrderNumber(generateOrderNumber());
        order.setPriority(req.priority() != null ? req.priority() : OrderPriority.REGULAR);
        order.setStatus(OrderStatus.QUEUED);
        order.setQueuedAt(Instant.now());
        order.setIdempotencyKey(req.idempotencyKey());
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentReference(req.demoPaymentReference());

        // Address snapshots
        CheckoutAddress addr = req.deliveryAddress();
        order.setAddressRecipientName(addr.recipientName());
        order.setAddressPhone(addr.phone());
        order.setAddressLine1(addr.streetLine1());
        order.setAddressLine2(addr.streetLine2());
        order.setAddressCity(addr.city());
        order.setAddressState(addr.state());
        order.setAddressPostalCode(addr.postalCode());
        order.setAddressInstructions(addr.deliveryInstructions());

        for (CartItem ci : cart.getItems()) {
            MenuItem mi = ci.getMenuItem();
            if (!mi.isAvailable() || mi.isDeleted()) {
                throw new BadRequestException("Item '" + mi.getName() + "' is no longer available");
            }
            BigDecimal unitPrice = mi.getPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem(
                order,
                mi,
                mi.getName(),
                unitPrice,
                ci.getQuantity(),
                lineTotal
            );
            orderItems.add(orderItem);
        }

        BigDecimal deliveryFee = restaurant.getDeliveryFee().setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(deliveryFee).add(tax).setScale(2, RoundingMode.HALF_UP);

        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTax(tax);
        order.setTotal(total);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // 3. Record Status Event
        OrderStatusEvent statusEvent = new OrderStatusEvent(
            savedOrder,
            null,
            OrderStatus.QUEUED,
            user.getId(),
            "Order confirmed and placed into kitchen queue (" + savedOrder.getPriority() + " priority)"
        );
        statusEventRepository.save(statusEvent);
        savedOrder.getStatusEvents().add(statusEvent);

        // 4. Transactional Outbox Event
        try {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("orderId", savedOrder.getId().toString());
            payloadMap.put("orderNumber", savedOrder.getOrderNumber());
            payloadMap.put("priority", savedOrder.getPriority().name());
            payloadMap.put("total", savedOrder.getTotal().toString());
            payloadMap.put("queuedAt", savedOrder.getQueuedAt().toString());

            OutboxEvent outboxEvent = new OutboxEvent(
                "ORDER_ENQUEUED",
                savedOrder.getId(),
                objectMapper.writeValueAsString(payloadMap)
            );
            outboxEventRepository.save(outboxEvent);
        } catch (Exception e) {
            // Outbox error should not kill order if serializing simple map, but log
            outboxEventRepository.save(new OutboxEvent(
                "ORDER_ENQUEUED",
                savedOrder.getId(),
                "{\"orderId\":\"" + savedOrder.getId() + "\"}"
            ));
        }

        // 5. Clear Cart
        cartService.clearCart(userId);

        return toDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(UUID orderId, UUID currentUserId, boolean isStaffOrAdmin) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!isStaffOrAdmin && !order.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have access to view this order");
        }

        return toDto(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getUserOrders(UUID userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(this::toDto);
    }

    @Transactional
    public OrderDto cancelOrder(UUID orderId, UUID currentUserId, boolean isStaffOrAdmin) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!isStaffOrAdmin && !order.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot cancel another user's order");
        }

        if (order.getStatus() != OrderStatus.QUEUED) {
            throw new ConflictException("ORDER_ALREADY_IN_PROGRESS",
                "Order cannot be cancelled because it is already " + order.getStatus().name().toLowerCase());
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        order.setCompletedAt(Instant.now());
        Order savedOrder = orderRepository.save(order);

        OrderStatusEvent statusEvent = new OrderStatusEvent(
            savedOrder,
            previousStatus,
            OrderStatus.CANCELLED,
            currentUserId,
            "Order cancelled by " + (isStaffOrAdmin ? "staff" : "customer")
        );
        statusEventRepository.save(statusEvent);
        savedOrder.getStatusEvents().add(statusEvent);

        outboxEventRepository.save(new OutboxEvent(
            "ORDER_CANCELLED",
            savedOrder.getId(),
            "{\"orderId\":\"" + savedOrder.getId() + "\"}"
        ));

        return toDto(savedOrder);
    }

    public OrderDto toDto(Order order) {
        CheckoutAddress address = new CheckoutAddress(
            order.getAddressRecipientName(),
            order.getAddressPhone(),
            order.getAddressLine1(),
            order.getAddressLine2(),
            order.getAddressCity(),
            order.getAddressState(),
            order.getAddressPostalCode(),
            order.getAddressInstructions()
        );

        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> new OrderItemDto(
            item.getId(),
            item.getMenuItem() != null ? item.getMenuItem().getId() : null,
            item.getItemName(),
            item.getUnitPrice(),
            item.getQuantity(),
            item.getLineTotal()
        )).collect(Collectors.toList());

        List<OrderStatusEventDto> eventDtos = order.getStatusEvents().stream().map(event -> new OrderStatusEventDto(
            event.getId(),
            event.getFromStatus(),
            event.getToStatus(),
            event.getActorUserId(),
            event.getNote(),
            event.getCreatedAt()
        )).sorted(Comparator.comparing(OrderStatusEventDto::createdAt)).collect(Collectors.toList());

        return new OrderDto(
            order.getId(),
            order.getOrderNumber(),
            order.getRestaurant().getId(),
            order.getRestaurant().getName(),
            address,
            order.getStatus(),
            order.getPriority(),
            order.getPriorityRank(),
            order.getQueuedAt(),
            order.getClaimedAt(),
            order.getCompletedAt(),
            order.getSubtotal(),
            order.getDeliveryFee(),
            order.getTax(),
            order.getTotal(),
            order.getPaymentStatus(),
            order.getPaymentReference(),
            itemDtos,
            eventDtos,
            order.getCreatedAt()
        );
    }

    private String generateOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomPart = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "POT-" + datePart + "-" + randomPart;
    }
}
