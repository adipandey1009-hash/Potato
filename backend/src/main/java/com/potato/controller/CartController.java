package com.potato.controller;

import com.potato.dto.ApiResponse;
import com.potato.dto.CartDtos.*;
import com.potato.security.UserPrincipal;
import com.potato.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        CartDto cart = cartService.getCartDto(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AddToCartRequest req
    ) {
        CartDto cart = cartService.addItem(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Item added to cart"));
    }

    @PatchMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDto>> updateQuantity(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID cartItemId,
        @Valid @RequestBody UpdateCartItemRequest req
    ) {
        CartDto cart = cartService.updateItemQuantity(principal.getId(), cartItemId, req.quantity());
        return ResponseEntity.ok(ApiResponse.ok(cart, "Cart item updated"));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDto>> removeItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID cartItemId
    ) {
        CartDto cart = cartService.removeItem(principal.getId(), cartItemId);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Item removed from cart"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.okMessage("Cart cleared"));
    }
}
