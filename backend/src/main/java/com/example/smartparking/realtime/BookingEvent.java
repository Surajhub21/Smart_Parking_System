package com.example.smartparking.realtime;

import com.example.smartparking.booking.BookingStatus;

import java.time.Instant;

/**
 * DTO for booking events sent to specific users via private destinations.
 * Sent to: /user/queue/bookings (private to the driver or owner involved)
 * <p>
 * Contains booking information relevant to the receiving user only.
 * Never broadcast to public topics.
 */
public class BookingEvent {

    private ParkingEventType eventType;

    private String bookingId;
    private String bookingReference;
    private String parkingLotId;
    private String parkingLotName;
    private String slotId;
    private String slotNumber;
    private BookingStatus status;
    private Instant timestamp;

    /** Additional context message */
    private String message;

    public BookingEvent() {}

    public BookingEvent(ParkingEventType eventType, String bookingId, String bookingReference,
                        String parkingLotId, String parkingLotName, String slotId,
                        String slotNumber, BookingStatus status, String message) {
        this.eventType = eventType;
        this.bookingId = bookingId;
        this.bookingReference = bookingReference;
        this.parkingLotId = parkingLotId;
        this.parkingLotName = parkingLotName;
        this.slotId = slotId;
        this.slotNumber = slotNumber;
        this.status = status;
        this.message = message;
        this.timestamp = Instant.now();
    }

    // ---- Getters ----

    public ParkingEventType getEventType() { return eventType; }
    public String getBookingId() { return bookingId; }
    public String getBookingReference() { return bookingReference; }
    public String getParkingLotId() { return parkingLotId; }
    public String getParkingLotName() { return parkingLotName; }
    public String getSlotId() { return slotId; }
    public String getSlotNumber() { return slotNumber; }
    public BookingStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public Instant getTimestamp() { return timestamp; }

    // ---- Setters ----

    public void setEventType(ParkingEventType eventType) { this.eventType = eventType; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
    public void setParkingLotName(String parkingLotName) { this.parkingLotName = parkingLotName; }
    public void setSlotId(String slotId) { this.slotId = slotId; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public void setMessage(String message) { this.message = message; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
