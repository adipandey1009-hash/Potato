package com.potato.dto;

import com.potato.entity.MenuCategory;
import com.potato.entity.MenuItem;
import com.potato.entity.Restaurant;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class RestaurantDtos {

    public record RestaurantSummaryDto(
        UUID id,
        String name,
        String slug,
        String description,
        String cuisine,
        String imageUrl,
        BigDecimal deliveryFee,
        int estimatedDeliveryMin,
        int estimatedDeliveryMax,
        boolean isActive
    ) {
        public static RestaurantSummaryDto fromEntity(Restaurant r) {
            return new RestaurantSummaryDto(
                r.getId(),
                r.getName(),
                r.getSlug(),
                r.getDescription(),
                r.getCuisine(),
                r.getImageUrl(),
                r.getDeliveryFee(),
                r.getEstimatedDeliveryMin(),
                r.getEstimatedDeliveryMax(),
                r.isActive()
            );
        }
    }

    public record MenuItemDto(
        UUID id,
        UUID categoryId,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean isAvailable,
        boolean isVegetarian
    ) {
        public static MenuItemDto fromEntity(MenuItem item) {
            return new MenuItemDto(
                item.getId(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getImageUrl(),
                item.isAvailable(),
                item.isVegetarian()
            );
        }
    }

    public record MenuCategoryDto(
        UUID id,
        String name,
        int sortOrder,
        List<MenuItemDto> items
    ) {
        public static MenuCategoryDto fromEntity(MenuCategory c, List<MenuItemDto> items) {
            return new MenuCategoryDto(
                c.getId(),
                c.getName(),
                c.getSortOrder(),
                items
            );
        }
    }

    public record RestaurantDetailDto(
        RestaurantSummaryDto restaurant,
        List<MenuCategoryDto> categories,
        List<MenuItemDto> allItems
    ) {}

    public record CreateRestaurantRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Slug is required") String slug,
        String description,
        @NotBlank(message = "Cuisine is required") String cuisine,
        @NotBlank(message = "Image URL is required") String imageUrl,
        @NotNull @DecimalMin("0.00") BigDecimal deliveryFee,
        int estimatedDeliveryMin,
        int estimatedDeliveryMax
    ) {}

    public record CreateMenuItemRequest(
        UUID categoryId,
        @NotBlank(message = "Item name is required") String name,
        String description,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotBlank(message = "Image URL is required") String imageUrl,
        boolean isVegetarian
    ) {}
}
