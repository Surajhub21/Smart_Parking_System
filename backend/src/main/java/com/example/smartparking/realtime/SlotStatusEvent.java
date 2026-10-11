package com.example.smartparking.realtime;

import com.example.smartparking.parking.slot.SlotStatus;

import java.time.Instant;

/**
 * DTO for slot status change events broadcast to subscribers.
 * Sent to: /topic/lots/{parkingLotId}/slots
 * <p>
 * Contains only publicly safe information — no private user data.
 */
public class SlotStatusEvent {

    private final ParkingEventType eventType = ParkingEventType.SLOT_STATUS_CHANGED;

    private String slotId;
    private String parkingLotId;
    private String slotNumber;
    private SlotStatus previousStatus;
    private SlotStatus newStatus;
    private Instant timestamp;

    public SlotStatusEvent() {}

    public SlotStatusEvent(String slotId, String parkingLotId, String slotNumber,
                           SlotStatus previousStatus, SlotStatus newStatus) {
        this.slotId = slotId;
        this.parkingLotId = parkingLotId;
        this.slotNumber = slotNumber;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.timestamp = Instant.now();
    }

    // ---- Getters ----

    public ParkingEventType getEventType() { return eventType; }
    public String getSlotId() { return slotId; }
    public String getParkingLotId() { return parkingLotId; }
    public String getSlotNumber() { return slotNumber; }
    public SlotStatus getPreviousStatus() { return previousStatus; }
    public SlotStatus getNewStatus() { return newStatus; }
    public Instant getTimestamp() { return timestamp; }

    // ---- Setters ----

    public void setSlotId(String slotId) { this.slotId = slotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }
    public void setPreviousStatus(SlotStatus previousStatus) { this.previousStatus = previousStatus; }
    public void setNewStatus(SlotStatus newStatus) { this.newStatus = newStatus; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
