package com.example.smartparking.booking;

import java.time.Instant;

/**
 * Response DTO for a booking.
 */
public class BookingResponse {

    private String id;
    private String bookingReference;
    private String driverId;
    private String parkingLotId;
    private String slotId;
    private String ownerId;
    private String parkingLotName;
    private String slotNumber;
    private String vehicleType;
    private String vehicleNumber;
    private BookingStatus status;
    private Instant startTime;
    private Instant endTime;
    private double pricePerHour;
    private double totalPrice;
    private String currency;
    private double durationHours;
    private String cancellationReason;
    private Instant cancelledAt;
    private Instant createdAt;

    public BookingResponse() {}

    public static BookingResponse fromEntity(Booking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setBookingReference(b.getBookingReference());
        r.setDriverId(b.getDriverId());
        r.setParkingLotId(b.getParkingLotId());
        r.setSlotId(b.getSlotId());
        r.setOwnerId(b.getOwnerId());
        r.setParkingLotName(b.getParkingLotName());
        r.setSlotNumber(b.getSlotNumber());
        r.setVehicleType(b.getVehicleType());
        r.setVehicleNumber(b.getVehicleNumber());
        r.setStatus(b.getStatus());
        r.setStartTime(b.getStartTime());
        r.setEndTime(b.getEndTime());
        r.setPricePerHour(b.getPricePerHour());
        r.setTotalPrice(b.getTotalPrice());
        r.setCurrency(b.getCurrency());
        r.setDurationHours(b.getDurationHours());
        r.setCancellationReason(b.getCancellationReason());
        r.setCancelledAt(b.getCancelledAt());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }

    // ---- Getters and Setters ----

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String ref) { this.bookingReference = ref; }

    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }

    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }

    public String getSlotId() { return slotId; }
    public void setSlotId(String slotId) { this.slotId = slotId; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getParkingLotName() { return parkingLotName; }
    public void setParkingLotName(String name) { this.parkingLotName = name; }

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
    public void setCancellationReason(String reason) { this.cancellationReason = reason; }

    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
