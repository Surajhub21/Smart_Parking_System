package com.example.smartparking.parking.slot;

import java.time.Instant;

/**
 * Summary of slot availability for a parking lot.
 */
public record SlotAvailabilitySummary(
        String parkingLotId,
        long totalSlots,
        long freeSlots,
        long occupiedSlots,
        long reservedSlots,
        long outOfServiceSlots,
        Instant lastUpdated
) {}
