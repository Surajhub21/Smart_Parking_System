package com.example.smartparking.common.exception;

/**
 * Thrown when a business rule is violated (e.g., duplicate email, invalid state transition).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
