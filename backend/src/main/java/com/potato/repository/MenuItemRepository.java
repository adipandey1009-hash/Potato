package com.potato.repository;

import com.potato.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByRestaurantIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID restaurantId);
    List<MenuItem> findByCategoryIdAndIsDeletedFalse(UUID categoryId);
    Optional<MenuItem> findByIdAndIsDeletedFalse(UUID id);
    long countByRestaurantIdAndIsDeletedFalse(UUID restaurantId);
}
