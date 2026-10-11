package com.example.smartparking.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/**
 * Validation error response with field-level details.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationErrorResponse {

    private boolean success = false;
    private String message;
    private List<FieldError> errors;
    private Instant timestamp;

    public ValidationErrorResponse(String message, List<FieldError> errors) {
        this.message = message;
        this.errors = errors;
        this.timestamp = Instant.now();
    }

    public record FieldError(String field, String message) {}

    // Getters

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public List<FieldError> getErrors() { return errors; }
    public Instant getTimestamp() { return timestamp; }
}
