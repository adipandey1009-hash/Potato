package com.potato.controller;

import com.potato.dto.ApiResponse;
import com.potato.dto.OrderDtos.*;
import com.potato.entity.Role;
import com.potato.security.UserPrincipal;
import com.potato.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderDto>> checkout(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CheckoutRequest req
    ) {
        OrderDto order = orderService.checkout(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(order, "Order placed successfully"));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getMyOrders(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OrderDto> orders = orderService.getUserOrders(principal.getId(), pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId
    ) {
        boolean isStaffOrAdmin = principal.getRole() == Role.KITCHEN_STAFF || principal.getRole() == Role.ADMIN;
        OrderDto order = orderService.getOrderById(orderId, principal.getId(), isStaffOrAdmin);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderStatus(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId
    ) {
        boolean isStaffOrAdmin = principal.getRole() == Role.KITCHEN_STAFF || principal.getRole() == Role.ADMIN;
        OrderDto order = orderService.getOrderById(orderId, principal.getId(), isStaffOrAdmin);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId
    ) {
        boolean isStaffOrAdmin = principal.getRole() == Role.KITCHEN_STAFF || principal.getRole() == Role.ADMIN;
        OrderDto order = orderService.cancelOrder(orderId, principal.getId(), isStaffOrAdmin);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order cancelled successfully"));
    }
}
