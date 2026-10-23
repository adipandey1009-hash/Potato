package com.potato.controller;

import com.potato.dto.ApiResponse;
import com.potato.dto.RestaurantDtos.*;
import com.potato.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RestaurantSummaryDto>>> getRestaurants(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String cuisine,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "name") String sortBy
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        Page<RestaurantSummaryDto> results = restaurantService.getRestaurants(search, cuisine, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<RestaurantDetailDto>> getRestaurantBySlug(@PathVariable String slug) {
        RestaurantDetailDto detail = restaurantService.getRestaurantBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @GetMapping("/{slug}/menu")
    public ResponseEntity<ApiResponse<RestaurantDetailDto>> getRestaurantMenu(@PathVariable String slug) {
        RestaurantDetailDto detail = restaurantService.getRestaurantBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RestaurantSummaryDto>> createRestaurant(
        @Valid @RequestBody CreateRestaurantRequest req
    ) {
        RestaurantSummaryDto created = restaurantService.createRestaurant(req);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(created, "Restaurant created successfully"));
    }

    @PostMapping("/{restaurantId}/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MenuItemDto>> createMenuItem(
        @PathVariable UUID restaurantId,
        @Valid @RequestBody CreateMenuItemRequest req
    ) {
        MenuItemDto item = restaurantService.createMenuItem(restaurantId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(item, "Menu item created successfully"));
    }

    @DeleteMapping("/{restaurantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRestaurant(@PathVariable UUID restaurantId) {
        restaurantService.deleteRestaurant(restaurantId);
        return ResponseEntity.ok(ApiResponse.okMessage("Restaurant deleted successfully"));
    }
}
