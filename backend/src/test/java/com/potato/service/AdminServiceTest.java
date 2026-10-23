package com.potato.service;

import com.potato.dto.AuthDtos.UserDto;
import com.potato.dto.OrderDtos.AdminDashboardMetricsDto;
import com.potato.entity.Order;
import com.potato.entity.OrderPriority;
import com.potato.entity.OrderStatus;
import com.potato.entity.Role;
import com.potato.entity.User;
import com.potato.repository.OrderRepository;
import com.potato.repository.RestaurantRepository;
import com.potato.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private RestaurantRepository restaurantRepository;
    @Mock
    private UserRepository userRepository;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(orderRepository, restaurantRepository, userRepository);
    }

    @Test
    @DisplayName("getDashboardMetrics() calculates metrics accurately")
    void testDashboardMetrics() {
        Order expressOrder = new Order();
        expressOrder.setPriority(OrderPriority.EXPRESS);

        when(orderRepository.count()).thenReturn(150L);
        when(orderRepository.countByStatus(OrderStatus.QUEUED)).thenReturn(5L);
        when(orderRepository.findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus.QUEUED))
            .thenReturn(List.of(expressOrder));
        when(restaurantRepository.countByIsActiveTrueAndIsDeletedFalse()).thenReturn(8L);
        when(userRepository.countByRoleAndIsDeletedFalse(Role.CUSTOMER)).thenReturn(120L);
        when(orderRepository.calculateTotalRevenue()).thenReturn(new BigDecimal("4520.50"));

        AdminDashboardMetricsDto metrics = adminService.getDashboardMetrics();

        assertThat(metrics.totalOrders()).isEqualTo(150L);
        assertThat(metrics.pendingQueueSize()).isEqualTo(5L);
        assertThat(metrics.expressQueueSize()).isEqualTo(1L);
        assertThat(metrics.activeRestaurants()).isEqualTo(8L);
        assertThat(metrics.totalCustomers()).isEqualTo(120L);
        assertThat(metrics.totalRevenue()).isEqualByComparingTo(new BigDecimal("4520.50"));
    }

    @Test
    @DisplayName("updateUserRole() changes user role and returns updated DTO")
    void testUpdateUserRole() {
        User user = new User("Staff Member", "staff@example.com", "hash", Role.CUSTOMER);
        user.setId(UUID.randomUUID());

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto updated = adminService.updateUserRole(user.getId(), Role.KITCHEN_STAFF);

        assertThat(updated.role()).isEqualTo(Role.KITCHEN_STAFF);
        assertThat(user.getRole()).isEqualTo(Role.KITCHEN_STAFF);
    }
}
