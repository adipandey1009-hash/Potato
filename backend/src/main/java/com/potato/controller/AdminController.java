package com.potato.controller;

import com.potato.dto.ApiResponse;
import com.potato.dto.AuthDtos.UserDto;
import com.potato.dto.OrderDtos.AdminDashboardMetricsDto;
import com.potato.entity.Role;
import com.potato.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminDashboardMetricsDto>> getMetrics() {
        AdminDashboardMetricsDto metrics = adminService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserDto> users = adminService.getUsers(pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
        @PathVariable UUID userId,
        @RequestBody Map<String, String> body
    ) {
        Role role = Role.valueOf(body.get("role"));
        UserDto updated = adminService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.ok(updated, "User role updated"));
    }

    @PatchMapping("/users/{userId}/toggle-active")
    public ResponseEntity<ApiResponse<UserDto>> toggleUserActive(@PathVariable UUID userId) {
        UserDto updated = adminService.toggleUserActive(userId);
        return ResponseEntity.ok(ApiResponse.ok(updated, "User active status toggled"));
    }
}
