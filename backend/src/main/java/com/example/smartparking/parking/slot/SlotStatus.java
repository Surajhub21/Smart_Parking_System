package com.example.smartparking.parking.slot;

/**
 * Status of an individual parking slot.
 * <p>
 * Owners manually report occupancy and slot status in the MVP.
 * Do not claim automatic vehicle detection.
 */
public enum SlotStatus {
    /** Slot is available for reservation */
    FREE,
    /** Slot is currently occupied (owner-reported) */
    OCCUPIED,
    /** Slot is reserved via an active booking */
    RESERVED,
    /** Slot is temporarily unavailable / under maintenance */
    OUT_OF_SERVICE
}
