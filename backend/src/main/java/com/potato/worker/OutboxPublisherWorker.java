package com.potato.worker;

import com.potato.entity.OutboxEvent;
import com.potato.entity.OutboxStatus;
import com.potato.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class OutboxPublisherWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisherWorker.class);

    private final OutboxEventRepository outboxEventRepository;
    private final StringRedisTemplate redisTemplate;

    public OutboxPublisherWorker(
        OutboxEventRepository outboxEventRepository,
        @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.redisTemplate = redisTemplate;
    }

    @Scheduled(fixedDelayString = "${potato.queue.outbox-poll-rate-ms:2000}")
    @Transactional
    public void processOutboxEvents() {
        Instant now = Instant.now();
        List<OutboxEvent> pendingEvents = outboxEventRepository
            .findByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
                OutboxStatus.PENDING,
                now,
                PageRequest.of(0, 50)
            );

        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            try {
                event.setAttempts(event.getAttempts() + 1);

                // Publish to Redis channel if Redis is active
                if (redisTemplate != null) {
                    try {
                        String channel = "potato.events." + event.getEventType().toLowerCase();
                        redisTemplate.convertAndSend(channel, event.getPayload());
                    } catch (Exception redisEx) {
                        log.debug("Redis publish skipped or unavailable: {}", redisEx.getMessage());
                    }
                }

                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(Instant.now());
                log.info("Outbox event [{}] {} processed successfully", event.getEventType(), event.getAggregateId());
            } catch (Exception ex) {
                log.error("Failed to process outbox event {}: {}", event.getId(), ex.getMessage());
                if (event.getAttempts() >= 5) {
                    event.setStatus(OutboxStatus.FAILED);
                } else {
                    // Exponential backoff
                    event.setAvailableAt(Instant.now().plusSeconds(event.getAttempts() * 5L));
                }
            }
        }
        outboxEventRepository.saveAll(pendingEvents);
    }
}
