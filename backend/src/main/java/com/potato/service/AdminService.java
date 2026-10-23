package com.potato.service;

import com.potato.dto.AuthDtos.UserDto;
import com.potato.dto.OrderDtos.AdminDashboardMetricsDto;
import com.potato.entity.OrderPriority;
import com.potato.entity.OrderStatus;
import com.potato.entity.Role;
import com.potato.entity.User;
import com.potato.exception.BadRequestException;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.OrderRepository;
import com.potato.repository.RestaurantRepository;
import com.potato.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class AdminService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public AdminService(
        OrderRepository orderRepository,
        RestaurantRepository restaurantRepository,
        UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardMetricsDto getDashboardMetrics() {
        long totalOrders = orderRepository.count();
        long pendingQueueSize = orderRepository.countByStatus(OrderStatus.QUEUED);
        long expressQueueSize = orderRepository.findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED)
            .stream().filter(o -> o.getPriority() == OrderPriority.EXPRESS).count();
        long activeRestaurants = restaurantRepository.countByIsActiveTrueAndIsDeletedFalse();
        long totalCustomers = userRepository.countByRoleAndIsDeletedFalse(Role.CUSTOMER);
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue().setScale(2, RoundingMode.HALF_UP);

        return new AdminDashboardMetricsDto(
            totalOrders,
            pendingQueueSize,
            expressQueueSize,
            activeRestaurants,
            totalCustomers,
            totalRevenue
        );
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Pageable pageable) {
        return userRepository.findByIsDeletedFalse(pageable)
            .map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(newRole);
        return UserDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserDto toggleUserActive(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(!user.isActive());
        return UserDto.fromEntity(userRepository.save(user));
    }
}
