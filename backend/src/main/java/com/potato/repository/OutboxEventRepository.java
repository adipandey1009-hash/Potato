package com.potato.repository;

import com.potato.entity.OutboxEvent;
import com.potato.entity.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {
    List<OutboxEvent> findByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
        OutboxStatus status,
        Instant availableAt,
        Pageable pageable
    );
}
