package com.potato.entity;

import java.util.Set;

public enum OrderStatus {
    QUEUED,
    CLAIMED,
    PREPARING,
    READY,
    DISPATCHED,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus next) {
        if (this == next) {
            return true;
        }
        return switch (this) {
            case QUEUED -> Set.of(CLAIMED, PREPARING, CANCELLED).contains(next);
            case CLAIMED -> Set.of(PREPARING, READY, CANCELLED).contains(next);
            case PREPARING -> Set.of(READY, CANCELLED).contains(next);
            case READY -> Set.of(DISPATCHED, CANCELLED).contains(next);
            case DISPATCHED -> Set.of(DELIVERED).contains(next);
            case DELIVERED, CANCELLED -> false;
        };
    }
}
