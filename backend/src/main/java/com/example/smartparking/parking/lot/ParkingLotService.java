package com.example.smartparking.parking.lot;

import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.common.exception.UnauthorizedException;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Business logic for parking lot management.
 * <p>
 * Enforces ownership on every mutation. Owners cannot modify other owners' listings.
 * Only admins can approve, reject, or suspend listings.
 */
@Service
public class ParkingLotService {

    private final ParkingLotRepository repository;

    public ParkingLotService(ParkingLotRepository repository) {
        this.repository = repository;
    }

    /**
     * Create a new parking lot in DRAFT status, owned by the authenticated user.
     */
    public ParkingLot create(String ownerId, ParkingLotRequest request) {
        ParkingLot lot = new ParkingLot();
        lot.setOwnerId(ownerId);
        mapRequestToEntity(request, lot);
        lot.setStatus(ListingStatus.DRAFT);
        lot.setAvailableSlots(0);
        lot.setAvailabilityLastUpdated(Instant.now());
        return repository.save(lot);
    }

    /**
     * Update a parking lot. Only the owning user can update, and only in editable states.
     */
    public ParkingLot update(String lotId, String ownerId, ParkingLotRequest request) {
        ParkingLot lot = getByIdAndOwner(lotId, ownerId);

        if (lot.getStatus() == ListingStatus.SUSPENDED) {
            throw new BadRequestException("Cannot edit a suspended listing. Contact admin.");
        }

        mapRequestToEntity(request, lot);

        // If the lot was APPROVED and is edited, revert to DRAFT so it needs re-approval
        if (lot.getStatus() == ListingStatus.APPROVED || lot.getStatus() == ListingStatus.REJECTED) {
            lot.setStatus(ListingStatus.DRAFT);
            lot.setStatusReason(null);
        }

        return repository.save(lot);
    }

    /**
     * Owner submits a DRAFT or REJECTED listing for admin approval.
     */
    public ParkingLot submitForApproval(String lotId, String ownerId) {
        ParkingLot lot = getByIdAndOwner(lotId, ownerId);

        if (lot.getStatus() != ListingStatus.DRAFT && lot.getStatus() != ListingStatus.REJECTED) {
            throw new BadRequestException("Only DRAFT or REJECTED listings can be submitted for approval");
        }

        lot.setStatus(ListingStatus.PENDING_APPROVAL);
        lot.setStatusReason(null);
        return repository.save(lot);
    }

    /**
     * Owner deactivates an active listing.
     */
    public ParkingLot deactivate(String lotId, String ownerId) {
        ParkingLot lot = getByIdAndOwner(lotId, ownerId);

        if (lot.getStatus() == ListingStatus.SUSPENDED) {
            throw new BadRequestException("Cannot deactivate a suspended listing");
        }

        lot.setStatus(ListingStatus.INACTIVE);
        return repository.save(lot);
    }

    /**
     * Owner reactivates an INACTIVE listing (goes back to DRAFT).
     */
    public ParkingLot reactivate(String lotId, String ownerId) {
        ParkingLot lot = getByIdAndOwner(lotId, ownerId);

        if (lot.getStatus() != ListingStatus.INACTIVE) {
            throw new BadRequestException("Only INACTIVE listings can be reactivated");
        }

        lot.setStatus(ListingStatus.DRAFT);
        lot.setStatusReason(null);
        return repository.save(lot);
    }

    /**
     * Get a parking lot by ID, verifying ownership.
     */
    public ParkingLot getByIdAndOwner(String lotId, String ownerId) {
        ParkingLot lot = repository.findById(lotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", lotId));

        if (!lot.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException("You do not own this parking lot");
        }

        return lot;
    }

    /**
     * Get all parking lots for an owner.
     */
    public List<ParkingLot> getByOwner(String ownerId) {
        return repository.findByOwnerId(ownerId);
    }

    /**
     * Get a parking lot by ID (public — no ownership check).
     * Used for viewing details.
     */
    public ParkingLot getById(String lotId) {
        return repository.findById(lotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", lotId));
    }

    // ---- Admin operations ----

    /**
     * Admin approves a PENDING_APPROVAL listing.
     */
    public ParkingLot approve(String lotId) {
        ParkingLot lot = getById(lotId);

        if (lot.getStatus() != ListingStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only PENDING_APPROVAL listings can be approved");
        }

        lot.setStatus(ListingStatus.APPROVED);
        lot.setStatusReason(null);
        return repository.save(lot);
    }

    /**
     * Admin rejects a PENDING_APPROVAL listing with a reason.
     */
    public ParkingLot reject(String lotId, String reason) {
        ParkingLot lot = getById(lotId);

        if (lot.getStatus() != ListingStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only PENDING_APPROVAL listings can be rejected");
        }

        lot.setStatus(ListingStatus.REJECTED);
        lot.setStatusReason(reason);
        return repository.save(lot);
    }

    /**
     * Admin suspends any active listing with a reason.
     */
    public ParkingLot suspend(String lotId, String reason) {
        ParkingLot lot = getById(lotId);

        if (lot.getStatus() == ListingStatus.SUSPENDED) {
            throw new BadRequestException("Listing is already suspended");
        }

        lot.setStatus(ListingStatus.SUSPENDED);
        lot.setStatusReason(reason);
        return repository.save(lot);
    }

    /**
     * Admin unsuspends a listing (returns to APPROVED).
     */
    public ParkingLot unsuspend(String lotId) {
        ParkingLot lot = getById(lotId);

        if (lot.getStatus() != ListingStatus.SUSPENDED) {
            throw new BadRequestException("Only SUSPENDED listings can be unsuspended");
        }

        lot.setStatus(ListingStatus.APPROVED);
        lot.setStatusReason(null);
        return repository.save(lot);
    }

    /**
     * Admin gets all listings with a specific status.
     */
    public List<ParkingLot> getByStatus(ListingStatus status) {
        return repository.findByStatus(status);
    }

    /**
     * Admin gets all listings.
     */
    public List<ParkingLot> getAll() {
        return repository.findAll();
    }

    // ---- Private helpers ----

    private void mapRequestToEntity(ParkingLotRequest request, ParkingLot lot) {
        lot.setName(request.getName().trim());
        lot.setDescription(request.getDescription());
        lot.setAddress(request.getAddress().trim());
        lot.setCity(request.getCity());
        lot.setState(request.getState());
        lot.setPincode(request.getPincode());

        // GeoJSON Point: [longitude, latitude]
        lot.setLocation(new GeoJsonPoint(request.getLongitude(), request.getLatitude()));

        lot.setTotalCapacity(request.getTotalCapacity());
        lot.setSupportedVehicles(request.getSupportedVehicles());
        lot.setAmenities(request.getAmenities());
        lot.setPricePerHour(request.getPricePerHour());
        lot.setOperatingHours(request.getOperatingHours());
        lot.setImages(request.getImages());
        lot.setContactPhone(request.getContactPhone());
        lot.setContactEmail(request.getContactEmail());
    }
}
