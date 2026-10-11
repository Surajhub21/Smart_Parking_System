package com.example.smartparking.parking.slot;

import com.example.smartparking.parking.lot.VehicleType;

import java.time.Instant;

/**
 * Response DTO for a parking slot. Never exposes the raw document directly.
 */
public class ParkingSlotResponse {

    private String id;
    private String parkingLotId;
    private String ownerId;
    private String slotNumber;
    private String label;
    private String floor;
    private VehicleType vehicleType;
    private SlotStatus status;
    private Instant statusLastUpdated;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public ParkingSlotResponse() {}

    /**
     * Map from ParkingSlot document to response DTO.
     */
    public static ParkingSlotResponse fromEntity(ParkingSlot slot) {
        ParkingSlotResponse r = new ParkingSlotResponse();
        r.setId(slot.getId());
        r.setParkingLotId(slot.getParkingLotId());
        r.setOwnerId(slot.getOwnerId());
        r.setSlotNumber(slot.getSlotNumber());
        r.setLabel(slot.getLabel());
        r.setFloor(slot.getFloor());
        r.setVehicleType(slot.getVehicleType());
        r.setStatus(slot.getStatus());
        r.setStatusLastUpdated(slot.getStatusLastUpdated());
        r.setNotes(slot.getNotes());
        r.setCreatedAt(slot.getCreatedAt());
        r.setUpdatedAt(slot.getUpdatedAt());
        return r;
    }

    // ---- Getters and Setters ----

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }

    public Instant getStatusLastUpdated() { return statusLastUpdated; }
    public void setStatusLastUpdated(Instant statusLastUpdated) { this.statusLastUpdated = statusLastUpdated; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
