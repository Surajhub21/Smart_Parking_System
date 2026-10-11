package com.example.smartparking.admin;

import com.example.smartparking.audit.AuditLog;
import com.example.smartparking.audit.AuditService;
import com.example.smartparking.booking.Booking;
import com.example.smartparking.booking.BookingRepository;
import com.example.smartparking.booking.BookingResponse;
import com.example.smartparking.booking.BookingService;
import com.example.smartparking.booking.BookingStatus;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.parking.lot.ListingStatus;
import com.example.smartparking.parking.lot.ParkingLotRepository;
import com.example.smartparking.parking.lot.ParkingLotResponse;
import com.example.smartparking.parking.lot.ParkingLotService;
import com.example.smartparking.security.UserPrincipal;
import com.example.smartparking.subscription.SubscriptionRepository;
import com.example.smartparking.subscription.SubscriptionStatus;
import com.example.smartparking.user.Role;
import com.example.smartparking.user.User;
import com.example.smartparking.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only REST controller for platform moderation.
 * <p>
 * All endpoints require ADMIN role.
 * Provides listing moderation, user management, booking review, audit logs,
 * and dashboard statistics.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ParkingLotService lotService;
    private final ParkingLotRepository lotRepository;
    private final UserRepository userRepository;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;
    private final SubscriptionRepository subscriptionRepository;

    public AdminController(ParkingLotService lotService,
                           ParkingLotRepository lotRepository,
                           UserRepository userRepository,
                           BookingService bookingService,
                           BookingRepository bookingRepository,
                           AuditService auditService,
                           SubscriptionRepository subscriptionRepository) {
        this.lotService = lotService;
        this.lotRepository = lotRepository;
        this.userRepository = userRepository;
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.auditService = auditService;
        this.subscriptionRepository = subscriptionRepository;
    }

    // ======================== DASHBOARD STATISTICS ========================

    /**
     * Get platform dashboard statistics for admin overview.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long driverCount = allUsers.stream().filter(u -> u.getRoles().contains(Role.DRIVER)).count();
        long ownerCount = allUsers.stream().filter(u -> u.getRoles().contains(Role.OWNER)).count();
        long adminCount = allUsers.stream().filter(u -> u.getRoles().contains(Role.ADMIN)).count();
        long suspendedUsers = allUsers.stream().filter(u -> !u.isActive()).count();

        long totalLots = lotRepository.count();
        long approvedLots = lotRepository.findByStatus(ListingStatus.APPROVED).size();
        long pendingLots = lotRepository.findByStatus(ListingStatus.PENDING_APPROVAL).size();
        long suspendedLots = lotRepository.findByStatus(ListingStatus.SUSPENDED).size();

        List<Booking> allBookings = bookingRepository.findAll();
        long totalBookings = allBookings.size();
        long confirmedBookings = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();
        long activeBookings = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.ACTIVE).count();
        long completedBookings = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        long cancelledBookings = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
        long expiredBookings = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.EXPIRED).count();

        double totalRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.ACTIVE
                        || b.getStatus() == BookingStatus.CONFIRMED)
                .mapToDouble(Booking::getTotalPrice)
                .sum();

        long activeSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE).size();
        long expiredSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.EXPIRED).size();
        long suspendedSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.SUSPENDED).size();

        DashboardStats stats = new DashboardStats(
                totalUsers, driverCount, ownerCount, adminCount, suspendedUsers,
                totalLots, approvedLots, pendingLots, suspendedLots,
                totalBookings, confirmedBookings, activeBookings, completedBookings,
                cancelledBookings, expiredBookings, totalRevenue,
                activeSubscriptions, expiredSubscriptions, suspendedSubscriptions
        );

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ======================== LISTING MODERATION ========================

    /**
     * Get all parking lots (admin view — all statuses).
     */
    @GetMapping("/lots")
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> getAllLots() {
        List<ParkingLotResponse> lots = lotRepository.findAll().stream()
                .map(ParkingLotResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(lots));
    }

    /**
     * Get parking lots by status (e.g., PENDING_APPROVAL).
     */
    @GetMapping("/lots/status/{status}")
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> getLotsByStatus(
            @PathVariable String status) {
        List<ParkingLotResponse> lots = lotRepository.findAll().stream()
                .filter(lot -> lot.getStatus().name().equalsIgnoreCase(status))
                .map(ParkingLotResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(lots));
    }

    // ======================== USER MANAGEMENT ========================

    /**
     * Get all users (admin view).
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserSummary>>> getAllUsers() {
        List<UserSummary> users = userRepository.findAll().stream()
                .map(u -> new UserSummary(u.getId(), u.getEmail(), u.getName(),
                        u.getRoles().toString(), u.isActive()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Get a specific user by ID.
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserSummary>> getUserById(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserSummary summary = new UserSummary(user.getId(), user.getEmail(), user.getName(),
                user.getRoles().toString(), user.isActive());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Suspend a user account.
     */
    @PatchMapping("/users/{userId}/suspend")
    public ResponseEntity<ApiResponse<String>> suspendUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(false);
        userRepository.save(user);

        auditService.logAction("USER_SUSPENDED", "User", userId,
                principal.getId(), "Suspended user: " + user.getEmail(),
                "active=true", "active=false");

        return ResponseEntity.ok(ApiResponse.success("User suspended: " + user.getEmail()));
    }

    /**
     * Reactivate a user account.
     */
    @PatchMapping("/users/{userId}/reactivate")
    public ResponseEntity<ApiResponse<String>> reactivateUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(true);
        userRepository.save(user);

        auditService.logAction("USER_REACTIVATED", "User", userId,
                principal.getId(), "Reactivated user: " + user.getEmail(),
                "active=false", "active=true");

        return ResponseEntity.ok(ApiResponse.success("User reactivated: " + user.getEmail()));
    }

    // ======================== BOOKING REVIEW ========================

    /**
     * Get all bookings (admin review).
     */
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        List<BookingResponse> bookings = bookingRepository.findAll().stream()
                .map(BookingResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    /**
     * Get bookings for a specific parking lot (admin review).
     */
    @GetMapping("/lots/{lotId}/bookings")
    public ResponseEntity<ApiResponse<List<Booking>>> getLotBookings(@PathVariable String lotId) {
        return ResponseEntity.ok(
                ApiResponse.success(bookingService.getLotBookings(lotId)));
    }

    /**
     * Trigger expiry of overdue bookings.
     */
    @PostMapping("/bookings/expire")
    public ResponseEntity<ApiResponse<String>> expireOverdueBookings() {
        int count = bookingService.expireOverdueBookings();
        return ResponseEntity.ok(
                ApiResponse.success("Expired " + count + " overdue bookings"));
    }

    // ======================== AUDIT LOGS ========================

    /**
     * Get audit logs for a specific entity.
     */
    @GetMapping("/audit/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ResponseEntity.ok(
                ApiResponse.success(auditService.getEntityHistory(entityType, entityId)));
    }

    /**
     * Get audit logs by action type.
     */
    @GetMapping("/audit/action/{action}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogsByAction(
            @PathVariable String action) {
        return ResponseEntity.ok(
                ApiResponse.success(auditService.getByAction(action)));
    }

    /**
     * Get audit logs by performer.
     */
    @GetMapping("/audit/performer/{performerId}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogsByPerformer(
            @PathVariable String performerId) {
        return ResponseEntity.ok(
                ApiResponse.success(auditService.getByPerformer(performerId)));
    }

    // ---- Helper DTOs ----

    public record UserSummary(String id, String email, String name, String role, boolean active) {}

    public record DashboardStats(
            // User metrics
            long totalUsers,
            long driverCount,
            long ownerCount,
            long adminCount,
            long suspendedUsers,
            // Parking lot metrics
            long totalLots,
            long approvedLots,
            long pendingLots,
            long suspendedLots,
            // Booking metrics
            long totalBookings,
            long confirmedBookings,
            long activeBookings,
            long completedBookings,
            long cancelledBookings,
            long expiredBookings,
            double totalRevenue,
            // Subscription metrics
            long activeSubscriptions,
            long expiredSubscriptions,
            long suspendedSubscriptions
    ) {}
}
