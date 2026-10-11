package com.example.smartparking.booking;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document representing a parking booking/reservation.
 * <p>
 * A booking references a real slot belonging to a specific parking lot.
 * Price snapshot is stored at booking time — never trust client-provided prices.
 */
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    /** Unique booking reference for display */
    @Indexed(unique = true)
    private String bookingReference;

    @Indexed
    private String driverId;

    @Indexed
    private String parkingLotId;

    @Indexed
    private String slotId;

    private String ownerId;

    private String parkingLotName;
    private String slotNumber;
    private String vehicleType;

    /** Driver's vehicle registration number */
    private String vehicleNumber;

    private BookingStatus status = BookingStatus.CONFIRMED;

    /** Session start time */
    private Instant startTime;

    /** Session end time */
    private Instant endTime;

    /** Backend-calculated price snapshot at booking time */
    private double pricePerHour;
    private double totalPrice;
    private String currency = "INR";

    /** Duration in hours */
    private double durationHours;

    private String cancellationReason;
    private Instant cancelledAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Booking() {}

    // ---- Getters and Setters ----

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }

    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }

    public String getSlotId() { return slotId; }
    public void setSlotId(String slotId) { this.slotId = slotId; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getParkingLotName() { return parkingLotName; }
    public void setParkingLotName(String parkingLotName) { this.parkingLotName = parkingLotName; }

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(double pricePerHour) { this.pricePerHour = pricePerHour; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public double getDurationHours() { return durationHours; }
    public void setDurationHours(double durationHours) { this.durationHours = durationHours; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
