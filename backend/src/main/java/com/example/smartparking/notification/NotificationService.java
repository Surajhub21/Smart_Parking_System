package com.example.smartparking.notification;

import com.example.smartparking.booking.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Notification service for the MVP.
 * <p>
 * In the MVP, notifications are logged. Email/SMS/push can be integrated later.
 * The WebSocket real-time events ({@link com.example.smartparking.realtime.ParkingEventPublisher})
 * handle live in-app notifications for connected clients.
 * <p>
 * This service covers cases where a user might NOT be connected via WebSocket,
 * such as email notifications for booking confirmations, reminders, etc.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    /**
     * Notify a user about a booking event.
     * MVP: logs the notification. Future: email/SMS.
     */
    public void notifyBookingEvent(Booking booking, String message) {
        log.info("NOTIFICATION [driver={}]: {} — booking {}",
                booking.getDriverId(), message, booking.getBookingReference());
    }

    /**
     * Notify a user with a generic message.
     * MVP: logs the notification. Future: email/SMS.
     */
    public void notifyUser(String userId, String subject, String message) {
        log.info("NOTIFICATION [user={}]: {} — {}", userId, subject, message);
    }

    /**
     * Notify an owner about activity on their parking lot.
     * MVP: logs the notification. Future: email/SMS.
     */
    public void notifyOwner(String ownerId, String subject, String message) {
        log.info("NOTIFICATION [owner={}]: {} — {}", ownerId, subject, message);
    }
}
