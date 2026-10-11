package com.example.smartparking.parking.slot;

import com.example.smartparking.parking.lot.VehicleType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document representing an individual parking slot within a parking lot.
 * <p>
 * Individual slot documents are the source of truth for reservations and slot states.
 * A unique compound index on { parkingLotId, slotNumber } prevents duplicate slot numbers.
 * <p>
 * Owners manually report occupancy in the MVP. Do not claim automatic vehicle detection.
 */
@Document(collection = "parking_slots")
@CompoundIndexes({
    @CompoundIndex(name = "lot_slot_unique", def = "{'parkingLotId': 1, 'slotNumber': 1}", unique = true)
})
public class ParkingSlot {

    @Id
    private String id;

    /** Reference to the parent parking lot */
    @Indexed
    private String parkingLotId;

    /** Owner's user ID — denormalized for efficient ownership checks */
    @Indexed
    private String ownerId;

    /** Unique slot identifier within the parking lot, e.g. "A1", "B12" */
    private String slotNumber;

    /** Human-readable label for display, e.g. "Ground Floor - A1" */
    private String label;

    /** Slot floor/level, e.g. "Ground", "Level 1" */
    private String floor;

    /** Vehicle type this slot supports */
    private VehicleType vehicleType;

    /** Current slot status */
    private SlotStatus status = SlotStatus.FREE;

    /** When the status was last changed */
    private Instant statusLastUpdated;

    /** Optional notes from the owner about this slot */
    private String notes;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public ParkingSlot() {}

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
