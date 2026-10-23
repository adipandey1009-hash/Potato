package com.potato.entity;

public enum OrderPriority {
    EXPRESS(1),
    REGULAR(2);

    private final int rank;

    OrderPriority(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }
}
