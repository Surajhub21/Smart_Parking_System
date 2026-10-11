package com.example.smartparking.booking;

/**
 * Booking lifecycle statuses with permitted transitions.
 */
public enum BookingStatus {
    /** Booking confirmed, slot reserved */
    CONFIRMED,
    /** Booking is active (driver is using the slot) */
    ACTIVE,
    /** Booking completed normally */
    COMPLETED,
    /** Booking cancelled by driver or owner */
    CANCELLED,
    /** Booking expired (time elapsed without check-in) */
    EXPIRED
}
