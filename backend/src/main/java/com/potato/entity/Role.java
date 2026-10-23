package com.potato.entity;

public enum Role {
    CUSTOMER,
    KITCHEN_STAFF,
    ADMIN;

    public String toAuthority() {
        return "ROLE_" + this.name();
    }
}
