package com.potato.controller;

import com.potato.dto.AddressDtos.*;
import com.potato.dto.ApiResponse;
import com.potato.entity.Address;
import com.potato.entity.User;
import com.potato.exception.ResourceNotFoundException;
import com.potato.repository.AddressRepository;
import com.potato.repository.UserRepository;
import com.potato.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressController(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(@AuthenticationPrincipal UserPrincipal principal) {
        List<AddressDto> addresses = addressRepository.findByUserIdOrderByCreatedAtDesc(principal.getId())
            .stream().map(AddressDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(addresses));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<AddressDto>> createAddress(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateAddressRequest req
    ) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.isDefault()) {
            addressRepository.findByUserIdAndIsDefaultTrue(principal.getId()).ifPresent(existingDefault -> {
                existingDefault.setDefault(false);
                addressRepository.save(existingDefault);
            });
        }

        Address address = new Address(
            user,
            req.label() != null ? req.label() : "Home",
            req.recipientName(),
            req.phone(),
            req.streetLine1(),
            req.streetLine2(),
            req.city(),
            req.state(),
            req.postalCode(),
            req.deliveryInstructions(),
            req.isDefault()
        );

        Address saved = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(AddressDto.fromEntity(saved), "Address saved successfully"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        Address address = addressRepository.findByIdAndUserId(id, principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        addressRepository.delete(address);
        return ResponseEntity.ok(ApiResponse.okMessage("Address deleted"));
    }
}
