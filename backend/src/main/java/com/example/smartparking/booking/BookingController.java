package com.example.smartparking.booking;

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
 * REST controller for booking management.
 * Driver endpoints: /api/bookings
 * Owner endpoints: /api/owner/bookings
 */
@RestController
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    // ======================== DRIVER ENDPOINTS ========================

    @PostMapping("/api/bookings")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<BookingResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BookingRequest request) {

        Booking booking = service.createBooking(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking confirmed", BookingResponse.fromEntity(booking)));
    }

    @GetMapping("/api/bookings/my")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<BookingResponse> bookings = service.getDriverBookings(principal.getId())
                .stream().map(BookingResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @GetMapping("/api/bookings/{id}")
    @PreAuthorize("hasRole('DRIVER') or hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> getById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Booking booking = service.getById(id);
        // Drivers can only view their own bookings
        if (principal.getAuthorities().stream().noneMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OWNER"))) {
            if (!booking.getDriverId().equals(principal.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Access denied"));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(BookingResponse.fromEntity(booking)));
    }

    @PatchMapping("/api/bookings/{id}/cancel")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<BookingResponse>> cancel(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) CancelRequest cancelRequest) {

        String reason = cancelRequest != null ? cancelRequest.getReason() : null;
        Booking booking = service.cancelBooking(id, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled", BookingResponse.fromEntity(booking)));
    }

    @PatchMapping("/api/bookings/{id}/complete")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<BookingResponse>> complete(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Booking booking = service.completeBooking(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Booking completed", BookingResponse.fromEntity(booking)));
    }

    @PatchMapping("/api/bookings/{id}/extend")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<BookingResponse>> extend(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ExtendRequest extendRequest) {

        Booking booking = service.extendBooking(id, principal.getId(), extendRequest.getAdditionalHours());
        return ResponseEntity.ok(ApiResponse.success("Booking extended", BookingResponse.fromEntity(booking)));
    }

    // ======================== OWNER ENDPOINTS ========================

    @GetMapping("/api/owner/bookings")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getOwnerBookings(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<BookingResponse> bookings = service.getOwnerBookings(principal.getId())
                .stream().map(BookingResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    /**
     * Owner views bookings for a specific parking lot they own.
     */
    @GetMapping("/api/owner/lots/{lotId}/bookings")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getOwnerLotBookings(
            @PathVariable String lotId,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Verify the owner owns this lot by checking via the lot bookings
        List<Booking> lotBookings = service.getLotBookings(lotId);
        // Filter to only bookings belonging to this owner's lot
        List<BookingResponse> bookings = lotBookings.stream()
                .filter(b -> principal.getId().equals(b.getOwnerId()))
                .map(BookingResponse::fromEntity)
                .toList();

        if (lotBookings.isEmpty() || bookings.size() == lotBookings.size()) {
            return ResponseEntity.ok(ApiResponse.success(bookings));
        }

        // If not all bookings belong to this owner, they don't own this lot
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    // ---- Helper DTOs ----

    public static class CancelRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class ExtendRequest {
        private double additionalHours;
        public double getAdditionalHours() { return additionalHours; }
        public void setAdditionalHours(double additionalHours) { this.additionalHours = additionalHours; }
    }
}
