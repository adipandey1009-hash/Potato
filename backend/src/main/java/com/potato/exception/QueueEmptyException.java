package com.potato.exception;

import org.springframework.http.HttpStatus;

public class QueueEmptyException extends AppException {
    public QueueEmptyException(String message) {
        super(HttpStatus.CONFLICT, "QUEUE_EMPTY", message);
    }
}
