package com.example.smartparking.parking.slot;

import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.exception.ConflictException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.common.exception.UnauthorizedException;
import com.example.smartparking.parking.lot.ParkingLot;
import com.example.smartparking.parking.lot.ParkingLotRepository;
import com.example.smartparking.realtime.ParkingEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Business logic for parking slot management.
 * <p>
 * Enforces ownership on every mutation. Owners cannot modify other owners' slots.
 * Slot status transitions are validated to prevent invalid state changes.
 * Available-slot counts on ParkingLot are kept consistent with actual slot states.
 * <p>
 * RESERVED status is managed by the booking system, not by direct owner updates.
 */
@Service
public class ParkingSlotService {

    private static final Logger log = LoggerFactory.getLogger(ParkingSlotService.class);

    /**
     * Valid transitions for owner-initiated status changes.
     * RESERVED can only be set/cleared by the booking system.
     */
    private static final Set<SlotStatus> OWNER_ALLOWED_STATUSES = Set.of(
            SlotStatus.FREE, SlotStatus.OCCUPIED, SlotStatus.OUT_OF_SERVICE
    );

    private final ParkingSlotRepository slotRepository;
    private final ParkingLotRepository lotRepository;
    private ParkingEventPublisher eventPublisher;

    public ParkingSlotService(ParkingSlotRepository slotRepository, ParkingLotRepository lotRepository) {
        this.slotRepository = slotRepository;
        this.lotRepository = lotRepository;
    }

    /**
     * Setter injection to avoid circular dependency with ParkingEventPublisher.
     * ParkingEventPublisher depends on ParkingSlotRepository (not this service),
     * but Spring may still create ordering issues with constructor injection.
     */
    @org.springframework.beans.factory.annotation.Autowired
    public void setEventPublisher(ParkingEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new parking slot within a parking lot.
     * Validates ownership and prevents duplicate slot numbers.
     */
    public ParkingSlot create(String parkingLotId, String ownerId, ParkingSlotRequest request) {
        ParkingLot lot = getOwnedLot(parkingLotId, ownerId);

        // Check for duplicate slot number within this lot
        if (slotRepository.existsByParkingLotIdAndSlotNumber(parkingLotId, request.getSlotNumber().trim())) {
            throw new ConflictException("Slot number '" + request.getSlotNumber().trim()
                    + "' already exists in this parking lot");
        }

        // Validate that the vehicle type is supported by the parking lot
        if (lot.getSupportedVehicles() != null && !lot.getSupportedVehicles().isEmpty()
                && !lot.getSupportedVehicles().contains(request.getVehicleType())) {
            throw new BadRequestException("Vehicle type " + request.getVehicleType()
                    + " is not supported by this parking lot. Supported types: "
                    + lot.getSupportedVehicles());
        }

        ParkingSlot slot = new ParkingSlot();
        slot.setParkingLotId(parkingLotId);
        slot.setOwnerId(ownerId);
        slot.setSlotNumber(request.getSlotNumber().trim());
        slot.setLabel(request.getLabel());
        slot.setFloor(request.getFloor());
        slot.setVehicleType(request.getVehicleType());
        slot.setStatus(SlotStatus.FREE);
        slot.setStatusLastUpdated(Instant.now());
        slot.setNotes(request.getNotes());

        ParkingSlot saved = slotRepository.save(slot);

        // Update available slots count on the parent lot
        updateLotAvailability(parkingLotId);

        log.info("Created slot {} in lot {} by owner {}", saved.getSlotNumber(), parkingLotId, ownerId);
        return saved;
    }

    /**
     * Create multiple slots at once (batch creation).
     * Useful for initial setup of a parking lot.
     */
    public List<ParkingSlot> createBatch(String parkingLotId, String ownerId, List<ParkingSlotRequest> requests) {
        // Validate ownership once
        getOwnedLot(parkingLotId, ownerId);

        List<ParkingSlot> created = requests.stream()
                .map(request -> create(parkingLotId, ownerId, request))
                .toList();

        log.info("Batch created {} slots in lot {} by owner {}", created.size(), parkingLotId, ownerId);
        return created;
    }

    /**
     * Update a slot's details (not status — use updateStatus for that).
     */
    public ParkingSlot update(String slotId, String ownerId, ParkingSlotRequest request) {
        ParkingSlot slot = getOwnedSlot(slotId, ownerId);

        // If slot number is changing, check for duplicates
        String newSlotNumber = request.getSlotNumber().trim();
        if (!slot.getSlotNumber().equals(newSlotNumber)) {
            if (slotRepository.existsByParkingLotIdAndSlotNumber(slot.getParkingLotId(), newSlotNumber)) {
                throw new ConflictException("Slot number '" + newSlotNumber
                        + "' already exists in this parking lot");
            }
        }

        slot.setSlotNumber(newSlotNumber);
        slot.setLabel(request.getLabel());
        slot.setFloor(request.getFloor());
        slot.setVehicleType(request.getVehicleType());
        slot.setNotes(request.getNotes());

        return slotRepository.save(slot);
    }

    /**
     * Owner updates slot status.
     * <p>
     * Validates that the transition is allowed:
     * - Owners can set FREE, OCCUPIED, or OUT_OF_SERVICE.
     * - Owners CANNOT manually set RESERVED (managed by booking system).
     * - A RESERVED slot cannot be changed by the owner (must cancel the booking first).
     */
    public ParkingSlot updateStatus(String slotId, String ownerId, SlotStatusUpdateRequest request) {
        ParkingSlot slot = getOwnedSlot(slotId, ownerId);

        SlotStatus currentStatus = slot.getStatus();
        SlotStatus newStatus = request.getStatus();

        // Owners cannot manually set RESERVED
        if (newStatus == SlotStatus.RESERVED) {
            throw new BadRequestException(
                    "RESERVED status is managed by the booking system. "
                    + "Use the booking API to reserve a slot.");
        }

        // Cannot change a RESERVED slot status — must cancel the booking first
        if (currentStatus == SlotStatus.RESERVED) {
            throw new BadRequestException(
                    "This slot is currently reserved. Cancel the booking first before changing its status.");
        }

        // Validate the target status is owner-allowed
        if (!OWNER_ALLOWED_STATUSES.contains(newStatus)) {
            throw new BadRequestException("Invalid status: " + newStatus
                    + ". Allowed statuses: " + OWNER_ALLOWED_STATUSES);
        }

        // No-op if status is unchanged
        if (currentStatus == newStatus) {
            return slot;
        }

        slot.setStatus(newStatus);
        slot.setStatusLastUpdated(Instant.now());
        if (request.getNotes() != null) {
            slot.setNotes(request.getNotes());
        }

        ParkingSlot saved = slotRepository.save(slot);

        // Update available slots count on the parent lot
        updateLotAvailability(slot.getParkingLotId());

        log.info("Slot {} status changed from {} to {} by owner {}",
                slotId, currentStatus, newStatus, ownerId);

        // Publish event AFTER successful DB commit
        if (eventPublisher != null) {
            eventPublisher.publishSlotStatusChanged(saved, currentStatus);
        }

        return saved;
    }

    /**
     * Batch update status for multiple slots in a parking lot.
     * Useful for marking all slots as OUT_OF_SERVICE or FREE.
     */
    public List<ParkingSlot> batchUpdateStatus(String parkingLotId, String ownerId,
                                                SlotStatus newStatus, List<String> slotIds) {
        getOwnedLot(parkingLotId, ownerId);

        if (newStatus == SlotStatus.RESERVED) {
            throw new BadRequestException("RESERVED status is managed by the booking system.");
        }

        List<ParkingSlot> updated = slotIds.stream()
                .map(slotId -> {
                    ParkingSlot slot = getOwnedSlot(slotId, ownerId);
                    if (slot.getStatus() == SlotStatus.RESERVED) {
                        log.warn("Skipping reserved slot {} in batch update", slotId);
                        return slot; // Skip reserved slots
                    }
                    slot.setStatus(newStatus);
                    slot.setStatusLastUpdated(Instant.now());
                    return slotRepository.save(slot);
                })
                .toList();

        updateLotAvailability(parkingLotId);
        return updated;
    }

    /**
     * Delete a slot. Cannot delete a RESERVED slot.
     */
    public void delete(String slotId, String ownerId) {
        ParkingSlot slot = getOwnedSlot(slotId, ownerId);

        if (slot.getStatus() == SlotStatus.RESERVED) {
            throw new BadRequestException(
                    "Cannot delete a reserved slot. Cancel the booking first.");
        }

        String lotId = slot.getParkingLotId();
        slotRepository.delete(slot);

        // Update available slots count on the parent lot
        updateLotAvailability(lotId);

        log.info("Deleted slot {} from lot {} by owner {}", slotId, lotId, ownerId);
    }

    /**
     * Get all slots for a parking lot (owner view — shows all statuses).
     */
    public List<ParkingSlot> getByParkingLot(String parkingLotId, String ownerId) {
        getOwnedLot(parkingLotId, ownerId);
        return slotRepository.findByParkingLotId(parkingLotId);
    }

    /**
     * Get all slots for a parking lot (public view — available for drivers).
     * Returns all slots so drivers can see capacity info.
     */
    public List<ParkingSlot> getByParkingLotPublic(String parkingLotId) {
        // Verify lot exists
        lotRepository.findById(parkingLotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", parkingLotId));
        return slotRepository.findByParkingLotId(parkingLotId);
    }

    /**
     * Get a specific slot by ID.
     */
    public ParkingSlot getById(String slotId) {
        return slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingSlot", "id", slotId));
    }

    /**
     * Get a specific slot with ownership verification.
     */
    public ParkingSlot getOwnedSlot(String slotId, String ownerId) {
        ParkingSlot slot = getById(slotId);
        if (!slot.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this parking slot");
        }
        return slot;
    }

    /**
     * Get slot availability summary for a parking lot.
     */
    public SlotAvailabilitySummary getAvailabilitySummary(String parkingLotId) {
        List<ParkingSlot> slots = slotRepository.findByParkingLotId(parkingLotId);

        long totalSlots = slots.size();
        long freeSlots = slots.stream().filter(s -> s.getStatus() == SlotStatus.FREE).count();
        long occupiedSlots = slots.stream().filter(s -> s.getStatus() == SlotStatus.OCCUPIED).count();
        long reservedSlots = slots.stream().filter(s -> s.getStatus() == SlotStatus.RESERVED).count();
        long outOfServiceSlots = slots.stream().filter(s -> s.getStatus() == SlotStatus.OUT_OF_SERVICE).count();

        // Find the most recent status update across all slots
        Instant lastUpdated = slots.stream()
                .map(ParkingSlot::getStatusLastUpdated)
                .filter(t -> t != null)
                .max(Instant::compareTo)
                .orElse(null);

        return new SlotAvailabilitySummary(
                parkingLotId, totalSlots, freeSlots, occupiedSlots,
                reservedSlots, outOfServiceSlots, lastUpdated
        );
    }

    // ---- Internal methods used by booking system ----

    /**
     * Reserve a slot atomically (called by BookingService).
     * This method should ideally use atomic conditional update.
     * Returns the updated slot or throws ConflictException if slot is not FREE.
     */
    public ParkingSlot reserveSlot(String slotId) {
        ParkingSlot slot = getById(slotId);
        if (slot.getStatus() != SlotStatus.FREE) {
            throw new ConflictException("Slot is not available. Current status: " + slot.getStatus());
        }
        slot.setStatus(SlotStatus.RESERVED);
        slot.setStatusLastUpdated(Instant.now());
        ParkingSlot saved = slotRepository.save(slot);
        updateLotAvailability(slot.getParkingLotId());

        // Publish event AFTER successful DB commit
        if (eventPublisher != null) {
            eventPublisher.publishSlotStatusChanged(saved, SlotStatus.FREE);
        }

        return saved;
    }

    /**
     * Release a reserved slot (called by BookingService on cancellation/expiry).
     */
    public ParkingSlot releaseSlot(String slotId) {
        ParkingSlot slot = getById(slotId);
        if (slot.getStatus() != SlotStatus.RESERVED) {
            log.warn("Attempted to release slot {} which is not reserved (status: {})",
                    slotId, slot.getStatus());
            return slot;
        }
        slot.setStatus(SlotStatus.FREE);
        slot.setStatusLastUpdated(Instant.now());
        ParkingSlot saved = slotRepository.save(slot);
        updateLotAvailability(slot.getParkingLotId());

        // Publish event AFTER successful DB commit
        if (eventPublisher != null) {
            eventPublisher.publishSlotStatusChanged(saved, SlotStatus.RESERVED);
        }

        return saved;
    }

    // ---- Private helpers ----

    /**
     * Verify that the parking lot exists and belongs to the given owner.
     */
    private ParkingLot getOwnedLot(String parkingLotId, String ownerId) {
        ParkingLot lot = lotRepository.findById(parkingLotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", parkingLotId));
        if (!lot.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this parking lot");
        }
        return lot;
    }

    /**
     * Recalculate and update the available slots count on the parent parking lot.
     * Available slots = count of slots with status FREE.
     */
    private void updateLotAvailability(String parkingLotId) {
        long freeCount = slotRepository.countByParkingLotIdAndStatus(parkingLotId, SlotStatus.FREE);
        long totalCount = slotRepository.countByParkingLotId(parkingLotId);

        lotRepository.findById(parkingLotId).ifPresent(lot -> {
            lot.setAvailableSlots((int) freeCount);
            lot.setTotalCapacity((int) totalCount);
            lot.setAvailabilityLastUpdated(Instant.now());
            lotRepository.save(lot);
        });
    }
}
