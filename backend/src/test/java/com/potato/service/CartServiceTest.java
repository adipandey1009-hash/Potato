package com.potato.service;

import com.potato.dto.CartDtos.*;
import com.potato.entity.*;
import com.potato.exception.BadRequestException;
import com.potato.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RestaurantRepository restaurantRepository;
    @Mock
    private MenuItemRepository menuItemRepository;

    private CartService cartService;
    private final BigDecimal taxRate = new BigDecimal("0.0825");

    private User user;
    private Restaurant restaurant;
    private MenuItem item;

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartRepository, cartItemRepository, userRepository, restaurantRepository, menuItemRepository, taxRate);

        user = new User("Customer", "c@example.com", "hash", Role.CUSTOMER);
        user.setId(UUID.randomUUID());

        restaurant = new Restaurant("Spud House", "spud", "Desc", "Comfort", "img", new BigDecimal("4.00"), 20, 30);
        restaurant.setId(UUID.randomUUID());

        item = new MenuItem(restaurant, null, "Mashed Bowl", "Desc", new BigDecimal("12.00"), "img", true, true);
        item.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("addItem() adds item to cart and calculates subtotal and tax")
    void testAddItem() {
        Cart cart = new Cart(user);
        cart.setId(UUID.randomUUID());

        when(cartRepository.findByUserId(user.getId())).thenReturn(Optional.of(cart));
        when(restaurantRepository.findByIdAndIsDeletedFalse(restaurant.getId())).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));

        AddToCartRequest req = new AddToCartRequest(restaurant.getId(), item.getId(), 2);
        CartDto result = cartService.addItem(user.getId(), req);

        assertThat(result.totalItems()).isEqualTo(2);
        assertThat(result.subtotal()).isEqualByComparingTo(new BigDecimal("24.00"));
        assertThat(result.deliveryFee()).isEqualByComparingTo(new BigDecimal("4.00"));
        // 24.00 * 0.0825 = 1.98
        assertThat(result.estimatedTax()).isEqualByComparingTo(new BigDecimal("1.98"));
        // 24 + 4 + 1.98 = 29.98
        assertThat(result.estimatedTotal()).isEqualByComparingTo(new BigDecimal("29.98"));
    }

    @Test
    @DisplayName("addItem() with unavailable item throws BadRequestException")
    void testAddUnavailableItemThrows() {
        Cart cart = new Cart(user);
        item.setAvailable(false);

        when(cartRepository.findByUserId(user.getId())).thenReturn(Optional.of(cart));
        when(restaurantRepository.findByIdAndIsDeletedFalse(restaurant.getId())).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findByIdAndIsDeletedFalse(item.getId())).thenReturn(Optional.of(item));

        AddToCartRequest req = new AddToCartRequest(restaurant.getId(), item.getId(), 1);

        assertThatThrownBy(() -> cartService.addItem(user.getId(), req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("currently unavailable");
    }
}
