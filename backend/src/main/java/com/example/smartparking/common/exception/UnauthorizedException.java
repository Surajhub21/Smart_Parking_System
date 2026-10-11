package com.example.smartparking.common.exception;

/**
 * Thrown when an authenticated user attempts an action they are not authorized to perform.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
