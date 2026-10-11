package com.example.smartparking.common.exception;

/**
 * Thrown when a conflict occurs (e.g., double booking, optimistic locking failure).
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
