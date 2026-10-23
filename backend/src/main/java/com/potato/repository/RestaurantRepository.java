package com.potato.repository;

import com.potato.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {
    Optional<Restaurant> findBySlugAndIsDeletedFalse(String slug);
    Optional<Restaurant> findByIdAndIsDeletedFalse(UUID id);
    boolean existsBySlug(String slug);

    @Query("SELECT r FROM Restaurant r WHERE r.isDeleted = false AND r.isActive = true " +
           "AND (:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.cuisine) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:cuisine IS NULL OR LOWER(r.cuisine) = LOWER(:cuisine))")
    Page<Restaurant> searchActiveRestaurants(@Param("search") String search, @Param("cuisine") String cuisine, Pageable pageable);

    Page<Restaurant> findByIsDeletedFalse(Pageable pageable);

    long countByIsActiveTrueAndIsDeletedFalse();
}
