package com.potato.service;

import com.potato.dto.CartDtos.*;
import com.potato.dto.RestaurantDtos.RestaurantSummaryDto;
import com.potato.entity.*;
import com.potato.exception.BadRequestException;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final BigDecimal taxRate;

    public CartService(
        CartRepository cartRepository,
        CartItemRepository cartItemRepository,
        UserRepository userRepository,
        RestaurantRepository restaurantRepository,
        MenuItemRepository menuItemRepository,
        @Value("${potato.finance.tax-rate:0.0825}") BigDecimal taxRate
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.taxRate = taxRate;
    }

    @Transactional
    public Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            Cart newCart = new Cart(user);
            return cartRepository.save(newCart);
        });
    }

    @Transactional(readOnly = true)
    public CartDto getCartDto(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return toDto(cart);
    }

    @Transactional
    public CartDto addItem(UUID userId, AddToCartRequest req) {
        if (req.quantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        Cart cart = getOrCreateCart(userId);
        Restaurant restaurant = restaurantRepository.findByIdAndIsDeletedFalse(req.restaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        MenuItem item = menuItemRepository.findByIdAndIsDeletedFalse(req.menuItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));

        if (!item.isAvailable()) {
            throw new BadRequestException("Item '" + item.getName() + "' is currently unavailable");
        }

        // Check if cart contains items from a different restaurant
        if (cart.getRestaurant() != null && !cart.getRestaurant().getId().equals(restaurant.getId())) {
            // Cart reset for new restaurant
            cart.getItems().clear();
            cartItemRepository.deleteByCartId(cart.getId());
        }

        cart.setRestaurant(restaurant);

        // Check if item already exists in cart
        CartItem existingItem = cart.getItems().stream()
            .filter(ci -> ci.getMenuItem().getId().equals(item.getId()))
            .findFirst()
            .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + req.quantity());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(cart, item, req.quantity());
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cartRepository.save(cart);
        return toDto(cart);
    }

    @Transactional
    public CartDto updateItemQuantity(UUID userId, UUID cartItemId, int quantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to your cart");
        }

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
            if (cart.getItems().isEmpty()) {
                cart.setRestaurant(null);
            }
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        cartRepository.save(cart);
        return toDto(cart);
    }

    @Transactional
    public CartDto removeItem(UUID userId, UUID cartItemId) {
        return updateItemQuantity(userId, cartItemId, 0);
    }

    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cart.setRestaurant(null);
        cartItemRepository.deleteByCartId(cart.getId());
        cartRepository.save(cart);
    }

    public CartDto toDto(Cart cart) {
        List<CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        int totalCount = 0;

        for (CartItem ci : cart.getItems()) {
            MenuItem mi = ci.getMenuItem();
            BigDecimal unitPrice = mi.getPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);
            totalCount += ci.getQuantity();

            itemDtos.add(new CartItemDto(
                ci.getId(),
                mi.getId(),
                mi.getName(),
                mi.getDescription(),
                mi.getImageUrl(),
                unitPrice,
                ci.getQuantity(),
                lineTotal
            ));
        }

        RestaurantSummaryDto restaurantDto = cart.getRestaurant() != null
            ? RestaurantSummaryDto.fromEntity(cart.getRestaurant())
            : null;

        BigDecimal deliveryFee = (cart.getRestaurant() != null && !itemDtos.isEmpty())
            ? cart.getRestaurant().getDeliveryFee().setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal estimatedTax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal estimatedTotal = subtotal.add(deliveryFee).add(estimatedTax).setScale(2, RoundingMode.HALF_UP);

        return new CartDto(
            cart.getId(),
            restaurantDto,
            itemDtos,
            totalCount,
            subtotal,
            deliveryFee,
            estimatedTax,
            estimatedTotal
        );
    }
}
