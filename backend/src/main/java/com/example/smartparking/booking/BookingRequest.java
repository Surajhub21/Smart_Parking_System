package com.example.smartparking.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a booking (immediate/session booking).
 */
public class BookingRequest {

    @NotBlank(message = "Parking lot ID is required")
    private String parkingLotId;

    @NotBlank(message = "Slot ID is required")
    private String slotId;

    /** Duration in hours */
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 hour")
    private Double durationHours;

    /** Driver's vehicle registration number */
    private String vehicleNumber;

    // ---- Getters and Setters ----

    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }

    public String getSlotId() { return slotId; }
    public void setSlotId(String slotId) { this.slotId = slotId; }

    public Double getDurationHours() { return durationHours; }
    public void setDurationHours(Double durationHours) { this.durationHours = durationHours; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
}
