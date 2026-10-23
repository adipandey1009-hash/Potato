package com.potato.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
    boolean success,
    ErrorDetail error,
    Instant timestamp
) {
    public record ErrorDetail(
        String code,
        String message,
        Object details
    ) {}

    public static ApiErrorResponse of(String code, String message, Object details) {
        return new ApiErrorResponse(false, new ErrorDetail(code, message, details), Instant.now());
    }

    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(false, new ErrorDetail(code, message, null), Instant.now());
    }
}
