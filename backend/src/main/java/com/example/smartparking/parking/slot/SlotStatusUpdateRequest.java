package com.example.smartparking.parking.slot;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating the status of a parking slot.
 * <p>
 * Owners use this to report occupancy changes (FREE, OCCUPIED, OUT_OF_SERVICE).
 * RESERVED status is managed by the booking system, not manual owner updates.
 */
public class SlotStatusUpdateRequest {

    @NotNull(message = "New status is required")
    private SlotStatus status;

    private String notes;

    // ---- Getters and Setters ----

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
