package com.example.smartparking.realtime;

import java.time.Instant;

/**
 * DTO for availability summary update events.
 * Sent to: /topic/lots/{parkingLotId}/availability
 * <p>
 * Contains aggregate availability — no private data.
 */
public class AvailabilityEvent {

    private final ParkingEventType eventType = ParkingEventType.AVAILABILITY_UPDATED;

    private String parkingLotId;
    private long totalSlots;
    private long freeSlots;
    private long occupiedSlots;
    private long reservedSlots;
    private long outOfServiceSlots;
    private Instant timestamp;

    public AvailabilityEvent() {}

    public AvailabilityEvent(String parkingLotId, long totalSlots, long freeSlots,
                              long occupiedSlots, long reservedSlots, long outOfServiceSlots) {
        this.parkingLotId = parkingLotId;
        this.totalSlots = totalSlots;
        this.freeSlots = freeSlots;
        this.occupiedSlots = occupiedSlots;
        this.reservedSlots = reservedSlots;
        this.outOfServiceSlots = outOfServiceSlots;
        this.timestamp = Instant.now();
    }

    // ---- Getters ----

    public ParkingEventType getEventType() { return eventType; }
    public String getParkingLotId() { return parkingLotId; }
    public long getTotalSlots() { return totalSlots; }
    public long getFreeSlots() { return freeSlots; }
    public long getOccupiedSlots() { return occupiedSlots; }
    public long getReservedSlots() { return reservedSlots; }
    public long getOutOfServiceSlots() { return outOfServiceSlots; }
    public Instant getTimestamp() { return timestamp; }

    // ---- Setters ----

    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
    public void setTotalSlots(long totalSlots) { this.totalSlots = totalSlots; }
    public void setFreeSlots(long freeSlots) { this.freeSlots = freeSlots; }
    public void setOccupiedSlots(long occupiedSlots) { this.occupiedSlots = occupiedSlots; }
    public void setReservedSlots(long reservedSlots) { this.reservedSlots = reservedSlots; }
    public void setOutOfServiceSlots(long outOfServiceSlots) { this.outOfServiceSlots = outOfServiceSlots; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
