package com.potato.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String cuisine;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee = new BigDecimal("3.99");

    @Column(name = "estimated_delivery_min", nullable = false)
    private int estimatedDeliveryMin = 25;

    @Column(name = "estimated_delivery_max", nullable = false)
    private int estimatedDeliveryMax = 40;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Restaurant() {}

    public Restaurant(String name, String slug, String description, String cuisine, String imageUrl,
                      BigDecimal deliveryFee, int estimatedDeliveryMin, int estimatedDeliveryMax) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.cuisine = cuisine;
        this.imageUrl = imageUrl;
        this.deliveryFee = deliveryFee;
        this.estimatedDeliveryMin = estimatedDeliveryMin;
        this.estimatedDeliveryMax = estimatedDeliveryMax;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCuisine() {
        return cuisine;
    }

    public void setCuisine(String cuisine) {
        this.cuisine = cuisine;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public int getEstimatedDeliveryMin() {
        return estimatedDeliveryMin;
    }

    public void setEstimatedDeliveryMin(int estimatedDeliveryMin) {
        this.estimatedDeliveryMin = estimatedDeliveryMin;
    }

    public int getEstimatedDeliveryMax() {
        return estimatedDeliveryMax;
    }

    public void setEstimatedDeliveryMax(int estimatedDeliveryMax) {
        this.estimatedDeliveryMax = estimatedDeliveryMax;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    public void setDeleted(boolean deleted) {
        isDeleted = deleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
