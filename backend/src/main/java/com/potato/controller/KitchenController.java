package com.potato.controller;

import com.potato.dto.ApiResponse;
import com.potato.dto.OrderDtos.*;
import com.potato.security.UserPrincipal;
import com.potato.service.KitchenQueueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kitchen")
@PreAuthorize("hasAnyRole('KITCHEN_STAFF', 'ADMIN')")
public class KitchenController {

    private final KitchenQueueService kitchenQueueService;

    public KitchenController(KitchenQueueService kitchenQueueService) {
        this.kitchenQueueService = kitchenQueueService;
    }

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<QueueOrderSummaryDto>>> getQueue() {
        List<QueueOrderSummaryDto> queue = kitchenQueueService.getPendingQueue();
        return ResponseEntity.ok(ApiResponse.ok(queue));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<QueueStatusDto>> getQueueStatus() {
        QueueStatusDto status = kitchenQueueService.getQueueStatus();
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/queue/peek")
    public ResponseEntity<ApiResponse<QueueOrderSummaryDto>> peekNext() {
        QueueOrderSummaryDto nextOrder = kitchenQueueService.peekNext().orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(nextOrder, nextOrder == null ? "Queue is currently empty" : "Next order peeked"));
    }

    @PostMapping("/queue/process-next")
    public ResponseEntity<ApiResponse<OrderDto>> processNext(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        OrderDto claimed = kitchenQueueService.processNext(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(claimed, "Order successfully claimed by kitchen"));
    }

    @GetMapping("/queue/empty")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isQueueEmpty() {
        boolean empty = kitchenQueueService.isQueueEmpty();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("empty", empty)));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
        @PathVariable UUID orderId,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        OrderDto updated = kitchenQueueService.updateOrderStatus(orderId, req.status(), req.note(), principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Order status advanced to " + req.status()));
    }

    @GetMapping("/orders/recent")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getRecentOrders(
        @RequestParam(defaultValue = "15") int limit
    ) {
        List<OrderDto> recent = kitchenQueueService.getRecentOrders(limit);
        return ResponseEntity.ok(ApiResponse.ok(recent));
    }
}
