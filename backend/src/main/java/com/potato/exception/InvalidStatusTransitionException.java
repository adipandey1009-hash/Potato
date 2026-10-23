package com.potato.exception;

import org.springframework.http.HttpStatus;

public class InvalidStatusTransitionException extends AppException {
    public InvalidStatusTransitionException(String message) {
        super(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION", message);
    }
}
