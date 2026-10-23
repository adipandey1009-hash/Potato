package com.potato.repository;

import com.potato.entity.Order;
import com.potato.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    Page<Order> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Order> findByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus status);

    Optional<Order> findFirstByStatusOrderByPriorityRankAscQueuedAtAscIdAsc(OrderStatus status);

    @Query(value = "SELECT * FROM orders WHERE status = 'QUEUED' ORDER BY priority_rank ASC, queued_at ASC, id ASC LIMIT 1 FOR UPDATE SKIP LOCKED", nativeQuery = true)
    Optional<Order> claimNextEligibleOrderSkipLocked();

    @Query("SELECT o FROM Order o WHERE o.status = :status ORDER BY o.priorityRank ASC, o.queuedAt ASC, o.id ASC")
    List<Order> findQueueInOrder(@Param("status") OrderStatus status);

    Page<Order> findByStatusInOrderByUpdatedAtDesc(List<OrderStatus> statuses, Pageable pageable);

    long countByStatus(OrderStatus status);

    long countByStatusIn(List<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.paymentStatus = com.potato.entity.PaymentStatus.PAID")
    java.math.BigDecimal calculateTotalRevenue();
}
