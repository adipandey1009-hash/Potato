package com.potato.repository;

import com.potato.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    Optional<CartItem> findByCartIdAndMenuItemId(UUID cartId, UUID menuItemId);
    void deleteByCartId(UUID cartId);
}
