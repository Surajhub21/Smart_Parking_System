package com.example.smartparking.parking.slot;

import com.example.smartparking.parking.lot.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new parking slot.
 */
public class ParkingSlotRequest {

    @NotBlank(message = "Slot number is required")
    @Size(max = 20, message = "Slot number must be at most 20 characters")
    private String slotNumber;

    @Size(max = 100, message = "Label must be at most 100 characters")
    private String label;

    @Size(max = 50, message = "Floor must be at most 50 characters")
    private String floor;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    private String notes;

    // ---- Getters and Setters ----

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
