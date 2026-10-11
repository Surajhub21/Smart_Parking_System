package com.example.smartparking.parking.slot;

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
 * REST controller for parking slot management.
 * Owner endpoints: /api/parking/lots/{lotId}/slots
 * Public endpoints: /api/parking/lots/public/{lotId}/slots
 */
@RestController
public class ParkingSlotController {

    private final ParkingSlotService service;

    public ParkingSlotController(ParkingSlotService service) {
        this.service = service;
    }

    // ======================== OWNER ENDPOINTS ========================

    @PostMapping("/api/parking/lots/{lotId}/slots")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> create(
            @PathVariable String lotId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ParkingSlotRequest request) {

        ParkingSlot slot = service.create(lotId, principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Slot created", ParkingSlotResponse.fromEntity(slot)));
    }

    @PostMapping("/api/parking/lots/{lotId}/slots/batch")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> createBatch(
            @PathVariable String lotId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody List<ParkingSlotRequest> requests) {

        List<ParkingSlotResponse> slots = service.createBatch(lotId, principal.getId(), requests)
                .stream().map(ParkingSlotResponse::fromEntity).toList();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Slots created", slots));
    }

    @PutMapping("/api/parking/slots/{slotId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> update(
            @PathVariable String slotId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ParkingSlotRequest request) {

        ParkingSlot slot = service.update(slotId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Slot updated", ParkingSlotResponse.fromEntity(slot)));
    }

    @PatchMapping("/api/parking/slots/{slotId}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> updateStatus(
            @PathVariable String slotId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SlotStatusUpdateRequest request) {

        ParkingSlot slot = service.updateStatus(slotId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Slot status updated", ParkingSlotResponse.fromEntity(slot)));
    }

    @DeleteMapping("/api/parking/slots/{slotId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String slotId,
            @AuthenticationPrincipal UserPrincipal principal) {

        service.delete(slotId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Slot deleted"));
    }

    @GetMapping("/api/parking/lots/{lotId}/slots")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> getByLot(
            @PathVariable String lotId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<ParkingSlotResponse> slots;
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            slots = service.getByParkingLotPublic(lotId).stream()
                    .map(ParkingSlotResponse::fromEntity).toList();
        } else {
            slots = service.getByParkingLot(lotId, principal.getId()).stream()
                    .map(ParkingSlotResponse::fromEntity).toList();
        }
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    // ======================== PUBLIC ENDPOINTS ========================

    @GetMapping("/api/parking/lots/public/{lotId}/slots")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> getPublicSlots(
            @PathVariable String lotId) {

        List<ParkingSlotResponse> slots = service.getByParkingLotPublic(lotId).stream()
                .map(ParkingSlotResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    @GetMapping("/api/parking/lots/public/{lotId}/availability")
    public ResponseEntity<ApiResponse<SlotAvailabilitySummary>> getAvailability(
            @PathVariable String lotId) {

        SlotAvailabilitySummary summary = service.getAvailabilitySummary(lotId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
