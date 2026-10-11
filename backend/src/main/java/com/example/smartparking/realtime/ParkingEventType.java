package com.example.smartparking.realtime;

/**
 * Enumeration of real-time event types published over WebSocket.
 * <p>
 * Events are published ONLY after successful database commit.
 */
public enum ParkingEventType {
    /** A slot's status changed (FREE, OCCUPIED, RESERVED, OUT_OF_SERVICE) */
    SLOT_STATUS_CHANGED,

    /** A booking was confirmed */
    BOOKING_CONFIRMED,

    /** A booking was cancelled */
    BOOKING_CANCELLED,

    /** A booking was extended */
    BOOKING_EXTENDED,

    /** A booking was completed */
    BOOKING_COMPLETED,

    /** A booking expired */
    BOOKING_EXPIRED,

    /** Availability summary updated for a parking lot */
    AVAILABILITY_UPDATED
}
