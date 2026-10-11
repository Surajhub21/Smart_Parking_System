package com.example.smartparking.parking.lot;

import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for parking lot management.
 * <p>
 * Owner endpoints under /api/parking/lots
 * Admin endpoints under /api/admin/parking/lots
 * Public endpoints under /api/parking/lots/public
 */
@RestController
public class ParkingLotController {

    private final ParkingLotService service;

    public ParkingLotController(ParkingLotService service) {
        this.service = service;
    }

    // ======================== OWNER ENDPOINTS ========================

    /**
     * Owner creates a new parking lot (DRAFT status).
     */
    @PostMapping("/api/parking/lots")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ParkingLotRequest request) {

        ParkingLot lot = service.create(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parking lot created", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Owner updates their own parking lot.
     */
    @PutMapping("/api/parking/lots/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> update(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ParkingLotRequest request) {

        ParkingLot lot = service.update(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Parking lot updated", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Owner submits a listing for admin approval.
     */
    @PatchMapping("/api/parking/lots/{id}/submit")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> submitForApproval(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        ParkingLot lot = service.submitForApproval(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Listing submitted for approval", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Owner deactivates their listing.
     */
    @PatchMapping("/api/parking/lots/{id}/deactivate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> deactivate(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        ParkingLot lot = service.deactivate(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Listing deactivated", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Owner reactivates an inactive listing (back to DRAFT).
     */
    @PatchMapping("/api/parking/lots/{id}/reactivate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> reactivate(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        ParkingLot lot = service.reactivate(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Listing reactivated", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Owner gets all their parking lots.
     */
    @GetMapping("/api/parking/lots/my")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> getMyLots(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<ParkingLotResponse> lots = service.getByOwner(principal.getId()).stream()
                .map(ParkingLotResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(lots));
    }

    /**
     * Owner gets one of their own parking lots by ID.
     */
    @GetMapping("/api/parking/lots/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> getById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        ParkingLot lot;
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            lot = service.getById(id);
        } else {
            lot = service.getByIdAndOwner(id, principal.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(ParkingLotResponse.fromEntity(lot)));
    }

    // ======================== PUBLIC ENDPOINTS ========================

    /**
     * Public list of all approved parking lots.
     */
    @GetMapping("/api/parking/lots/public")
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> getPublicApproved() {
        List<ParkingLotResponse> lots = service.getByStatus(ListingStatus.APPROVED).stream()
                .map(ParkingLotResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(lots));
    }

    /**
     * Public view of an approved parking lot (for drivers browsing).
     */
    @GetMapping("/api/parking/lots/public/{id}")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> getPublicById(@PathVariable String id) {
        ParkingLot lot = service.getById(id);
        if (lot.getStatus() != ListingStatus.APPROVED) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Parking lot not found or not available"));
        }
        return ResponseEntity.ok(ApiResponse.success(ParkingLotResponse.fromEntity(lot)));
    }

    // ======================== ADMIN ENDPOINTS ========================

    /**
     * Admin approves a pending listing.
     */
    @PatchMapping("/api/admin/parking/lots/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> approve(@PathVariable String id) {
        ParkingLot lot = service.approve(id);
        return ResponseEntity.ok(ApiResponse.success("Listing approved", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Admin rejects a pending listing.
     */
    @PatchMapping("/api/admin/parking/lots/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> reject(
            @PathVariable String id,
            @RequestBody(required = false) StatusReasonRequest reason) {

        String r = reason != null ? reason.getReason() : "Rejected by admin";
        ParkingLot lot = service.reject(id, r);
        return ResponseEntity.ok(ApiResponse.success("Listing rejected", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Admin suspends a listing.
     */
    @PatchMapping("/api/admin/parking/lots/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> suspend(
            @PathVariable String id,
            @RequestBody(required = false) StatusReasonRequest reason) {

        String r = reason != null ? reason.getReason() : "Suspended by admin";
        ParkingLot lot = service.suspend(id, r);
        return ResponseEntity.ok(ApiResponse.success("Listing suspended", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Admin unsuspends a listing.
     */
    @PatchMapping("/api/admin/parking/lots/{id}/unsuspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> unsuspend(@PathVariable String id) {
        ParkingLot lot = service.unsuspend(id);
        return ResponseEntity.ok(ApiResponse.success("Listing unsuspended", ParkingLotResponse.fromEntity(lot)));
    }

    /**
     * Admin lists all parking lots, optionally filtered by status.
     */
    @GetMapping("/api/admin/parking/lots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> adminGetAll(
            @RequestParam(required = false) ListingStatus status) {

        List<ParkingLot> lots = status != null ? service.getByStatus(status) : service.getAll();
        List<ParkingLotResponse> responses = lots.stream()
                .map(ParkingLotResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    // ---- Helper DTO for status reason ----

    public static class StatusReasonRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
