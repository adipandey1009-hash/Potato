package com.potato.dto;

import com.potato.dto.RestaurantDtos.RestaurantSummaryDto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CartDtos {

    public record CartItemDto(
        UUID id,
        UUID menuItemId,
        String name,
        String description,
        String imageUrl,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
    ) {}

    public record CartDto(
        UUID id,
        RestaurantSummaryDto restaurant,
        List<CartItemDto> items,
        int totalItems,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal estimatedTax,
        BigDecimal estimatedTotal
    ) {}

    public record AddToCartRequest(
        @NotNull(message = "Restaurant ID is required")
        UUID restaurantId,

        @NotNull(message = "Menu item ID is required")
        UUID menuItemId,

        @Min(value = 1, message = "Quantity must be at least 1")
        int quantity
    ) {}

    public record UpdateCartItemRequest(
        @Min(value = 0, message = "Quantity cannot be negative")
        int quantity
    ) {}
}
