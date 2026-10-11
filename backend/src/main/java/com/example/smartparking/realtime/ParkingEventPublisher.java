package com.example.smartparking.realtime;

import com.example.smartparking.booking.Booking;
import com.example.smartparking.booking.BookingStatus;
import com.example.smartparking.parking.slot.ParkingSlot;
import com.example.smartparking.parking.slot.ParkingSlotRepository;
import com.example.smartparking.parking.slot.SlotStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central service for publishing real-time events over WebSocket/STOMP.
 * <p>
 * Rules enforced:
 * <ul>
 *   <li>Events are published ONLY after successful database commit — callers must
 *       invoke these methods after the DB write succeeds.</li>
 *   <li>Private booking information is sent only to the involved driver and owner
 *       via /user/queue/bookings — never broadcast to public topics.</li>
 *   <li>Public slot and availability updates go to /topic/lots/{lotId}/slots and
 *       /topic/lots/{lotId}/availability.</li>
 * </ul>
 */
@Service
public class ParkingEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ParkingEventPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ParkingSlotRepository slotRepository;

    public ParkingEventPublisher(SimpMessagingTemplate messagingTemplate,
                                  ParkingSlotRepository slotRepository) {
        this.messagingTemplate = messagingTemplate;
        this.slotRepository = slotRepository;
    }

    // ======================== SLOT EVENTS (PUBLIC) ========================

    /**
     * Publish a slot status change event to all subscribers of the parking lot.
     * Call ONLY after the database write has succeeded.
     *
     * @param slot           the updated slot (after DB save)
     * @param previousStatus the status before the change
     */
    public void publishSlotStatusChanged(ParkingSlot slot, SlotStatus previousStatus) {
        try {
            SlotStatusEvent event = new SlotStatusEvent(
                    slot.getId(),
                    slot.getParkingLotId(),
                    slot.getSlotNumber(),
                    previousStatus,
                    slot.getStatus()
            );

            String destination = "/topic/lots/" + slot.getParkingLotId() + "/slots";
            messagingTemplate.convertAndSend(destination, event);

            log.debug("Published SLOT_STATUS_CHANGED to {} — slot {} from {} to {}",
                    destination, slot.getSlotNumber(), previousStatus, slot.getStatus());

            // Also publish updated availability summary
            publishAvailabilityUpdate(slot.getParkingLotId());

        } catch (Exception e) {
            // WebSocket publish failures must not break the main flow
            log.error("Failed to publish slot status event for slot {}: {}",
                    slot.getId(), e.getMessage());
        }
    }

    /**
     * Publish an availability summary update for a parking lot.
     * Call after any change that affects slot counts.
     */
    public void publishAvailabilityUpdate(String parkingLotId) {
        try {
            List<ParkingSlot> slots = slotRepository.findByParkingLotId(parkingLotId);

            long total = slots.size();
            long free = slots.stream().filter(s -> s.getStatus() == SlotStatus.FREE).count();
            long occupied = slots.stream().filter(s -> s.getStatus() == SlotStatus.OCCUPIED).count();
            long reserved = slots.stream().filter(s -> s.getStatus() == SlotStatus.RESERVED).count();
            long outOfService = slots.stream().filter(s -> s.getStatus() == SlotStatus.OUT_OF_SERVICE).count();

            AvailabilityEvent event = new AvailabilityEvent(
                    parkingLotId, total, free, occupied, reserved, outOfService
            );

            String destination = "/topic/lots/" + parkingLotId + "/availability";
            messagingTemplate.convertAndSend(destination, event);

            log.debug("Published AVAILABILITY_UPDATED to {} — free: {}/{}", destination, free, total);

        } catch (Exception e) {
            log.error("Failed to publish availability event for lot {}: {}",
                    parkingLotId, e.getMessage());
        }
    }

    // ======================== BOOKING EVENTS (PRIVATE) ========================

    /**
     * Publish a booking event to the involved driver and owner.
     * Uses /user/queue/bookings — private to each user.
     * Call ONLY after the database write has succeeded.
     *
     * @param booking   the booking (after DB save)
     * @param eventType the type of booking event
     * @param message   human-readable context message
     */
    public void publishBookingEvent(Booking booking, ParkingEventType eventType, String message) {
        try {
            BookingEvent event = new BookingEvent(
                    eventType,
                    booking.getId(),
                    booking.getBookingReference(),
                    booking.getParkingLotId(),
                    booking.getParkingLotName(),
                    booking.getSlotId(),
                    booking.getSlotNumber(),
                    booking.getStatus(),
                    message
            );

            // Send to the driver (private queue)
            if (booking.getDriverId() != null) {
                messagingTemplate.convertAndSendToUser(
                        booking.getDriverId(),
                        "/queue/bookings",
                        event
                );
                log.debug("Published {} to driver {} — booking {}",
                        eventType, booking.getDriverId(), booking.getBookingReference());
            }

            // Send to the parking lot owner (private queue)
            if (booking.getOwnerId() != null) {
                messagingTemplate.convertAndSendToUser(
                        booking.getOwnerId(),
                        "/queue/bookings",
                        event
                );
                log.debug("Published {} to owner {} — booking {}",
                        eventType, booking.getOwnerId(), booking.getBookingReference());
            }

        } catch (Exception e) {
            // WebSocket publish failures must not break the main flow
            log.error("Failed to publish booking event {} for booking {}: {}",
                    eventType, booking.getId(), e.getMessage());
        }
    }

    /**
     * Convenience: publish BOOKING_CONFIRMED.
     */
    public void publishBookingConfirmed(Booking booking) {
        publishBookingEvent(booking, ParkingEventType.BOOKING_CONFIRMED,
                "Booking " + booking.getBookingReference() + " confirmed for slot " + booking.getSlotNumber());
    }

    /**
     * Convenience: publish BOOKING_CANCELLED.
     */
    public void publishBookingCancelled(Booking booking) {
        publishBookingEvent(booking, ParkingEventType.BOOKING_CANCELLED,
                "Booking " + booking.getBookingReference() + " has been cancelled");
    }

    /**
     * Convenience: publish BOOKING_COMPLETED.
     */
    public void publishBookingCompleted(Booking booking) {
        publishBookingEvent(booking, ParkingEventType.BOOKING_COMPLETED,
                "Booking " + booking.getBookingReference() + " completed");
    }

    /**
     * Convenience: publish BOOKING_EXTENDED.
     */
    public void publishBookingExtended(Booking booking) {
        publishBookingEvent(booking, ParkingEventType.BOOKING_EXTENDED,
                "Booking " + booking.getBookingReference() + " extended until " + booking.getEndTime());
    }

    /**
     * Convenience: publish BOOKING_EXPIRED.
     */
    public void publishBookingExpired(Booking booking) {
        publishBookingEvent(booking, ParkingEventType.BOOKING_EXPIRED,
                "Booking " + booking.getBookingReference() + " has expired");
    }
}
