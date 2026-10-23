package com.potato.service;

import com.potato.dto.RestaurantDtos.*;
import com.potato.entity.MenuCategory;
import com.potato.entity.MenuItem;
import com.potato.entity.Restaurant;
import com.potato.exception.ConflictException;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.MenuCategoryRepository;
import com.potato.repository.MenuItemRepository;
import com.potato.repository.RestaurantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantService(
        RestaurantRepository restaurantRepository,
        MenuCategoryRepository categoryRepository,
        MenuItemRepository menuItemRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional(readOnly = true)
    public Page<RestaurantSummaryDto> getRestaurants(String search, String cuisine, Pageable pageable) {
        String query = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cuisineFilter = (cuisine != null && !cuisine.trim().isEmpty() && !cuisine.equalsIgnoreCase("all")) ? cuisine.trim() : null;

        return restaurantRepository.searchActiveRestaurants(query, cuisineFilter, pageable)
            .map(RestaurantSummaryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public RestaurantDetailDto getRestaurantBySlug(String slug) {
        Restaurant restaurant = restaurantRepository.findBySlugAndIsDeletedFalse(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with slug: " + slug));

        List<MenuCategory> categories = categoryRepository.findByRestaurantIdOrderBySortOrderAscNameAsc(restaurant.getId());
        List<MenuItem> allItems = menuItemRepository.findByRestaurantIdAndIsDeletedFalseOrderByCreatedAtAsc(restaurant.getId());

        List<MenuItemDto> allItemDtos = allItems.stream()
            .map(MenuItemDto::fromEntity)
            .collect(Collectors.toList());

        List<MenuCategoryDto> categoryDtos = categories.stream().map(cat -> {
            List<MenuItemDto> catItems = allItemDtos.stream()
                .filter(item -> cat.getId().equals(item.categoryId()))
                .collect(Collectors.toList());
            return MenuCategoryDto.fromEntity(cat, catItems);
        }).collect(Collectors.toList());

        return new RestaurantDetailDto(
            RestaurantSummaryDto.fromEntity(restaurant),
            categoryDtos,
            allItemDtos
        );
    }

    @Transactional(readOnly = true)
    public Restaurant getEntityById(UUID restaurantId) {
        return restaurantRepository.findByIdAndIsDeletedFalse(restaurantId)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with ID: " + restaurantId));
    }

    @Transactional
    public RestaurantSummaryDto createRestaurant(CreateRestaurantRequest req) {
        if (restaurantRepository.existsBySlug(req.slug())) {
            throw new ConflictException("SLUG_TAKEN", "A restaurant with slug '" + req.slug() + "' already exists");
        }

        Restaurant restaurant = new Restaurant(
            req.name(),
            req.slug(),
            req.description(),
            req.cuisine(),
            req.imageUrl(),
            req.deliveryFee(),
            req.estimatedDeliveryMin(),
            req.estimatedDeliveryMax()
        );

        return RestaurantSummaryDto.fromEntity(restaurantRepository.save(restaurant));
    }

    @Transactional
    public MenuItemDto createMenuItem(UUID restaurantId, CreateMenuItemRequest req) {
        Restaurant restaurant = getEntityById(restaurantId);
        MenuCategory category = null;
        if (req.categoryId() != null) {
            category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        MenuItem item = new MenuItem(
            restaurant,
            category,
            req.name(),
            req.description(),
            req.price(),
            req.imageUrl(),
            true,
            req.isVegetarian()
        );

        return MenuItemDto.fromEntity(menuItemRepository.save(item));
    }

    @Transactional
    public void deleteRestaurant(UUID restaurantId) {
        Restaurant restaurant = getEntityById(restaurantId);
        restaurant.setDeleted(true);
        restaurant.setDeletedAt(Instant.now());
        restaurantRepository.save(restaurant);
    }
}
