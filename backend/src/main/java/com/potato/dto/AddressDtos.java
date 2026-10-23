package com.potato.dto;

import com.potato.entity.Address;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public class AddressDtos {

    public record AddressDto(
        UUID id,
        String label,
        String recipientName,
        String phone,
        String streetLine1,
        String streetLine2,
        String city,
        String state,
        String postalCode,
        String deliveryInstructions,
        boolean isDefault
    ) {
        public static AddressDto fromEntity(Address a) {
            return new AddressDto(
                a.getId(),
                a.getLabel(),
                a.getRecipientName(),
                a.getPhone(),
                a.getStreetLine1(),
                a.getStreetLine2(),
                a.getCity(),
                a.getState(),
                a.getPostalCode(),
                a.getDeliveryInstructions(),
                a.isDefault()
            );
        }
    }

    public record CreateAddressRequest(
        String label,
        @NotBlank(message = "Recipient name is required") String recipientName,
        @NotBlank(message = "Phone number is required") String phone,
        @NotBlank(message = "Street address is required") String streetLine1,
        String streetLine2,
        @NotBlank(message = "City is required") String city,
        @NotBlank(message = "State is required") String state,
        @NotBlank(message = "Postal code is required") String postalCode,
        String deliveryInstructions,
        boolean isDefault
    ) {}
}
