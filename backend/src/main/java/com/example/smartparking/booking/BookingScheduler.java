package com.example.smartparking.booking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task that automatically expires overdue bookings.
 * Runs every 5 minutes to find bookings whose endTime has passed
 * and whose status is still CONFIRMED or ACTIVE, then marks them EXPIRED
 * and releases the associated slots.
 */
@Component
public class BookingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingScheduler.class);

    private final BookingService bookingService;

    public BookingScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedRate = 300_000) // every 5 minutes
    public void expireOverdueBookings() {
        try {
            int expired = bookingService.expireOverdueBookings();
            if (expired > 0) {
                log.info("Scheduled expiry: {} bookings expired", expired);
            }
        } catch (Exception e) {
            log.error("Scheduled booking expiry failed: {}", e.getMessage());
        }
    }
}
