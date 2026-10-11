package com.example.smartparking.subscription;

import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for subscription management.
 * <p>
 * Owner endpoints: view own subscriptions and available plans.
 * Admin endpoints: activate, suspend, and manage subscriptions.
 */
@RestController
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    // ======================== PUBLIC / OWNER ENDPOINTS ========================

    /**
     * Get all available visibility plans.
     */
    @GetMapping("/api/subscriptions/plans")
    public ResponseEntity<ApiResponse<List<Plan>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getAllPlans()));
    }

    /**
     * Owner views their subscriptions.
     */
    @GetMapping("/api/subscriptions/my")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<Subscription>>> getMySubscriptions(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                ApiResponse.success(subscriptionService.getByOwner(principal.getId())));
    }

    /**
     * Owner views subscription for a specific parking lot.
     */
    @GetMapping("/api/subscriptions/lot/{parkingLotId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Subscription>> getByParkingLot(
            @PathVariable String parkingLotId) {
        return subscriptionService.getByParkingLot(parkingLotId)
                .map(sub -> ResponseEntity.ok(ApiResponse.success(sub)))
                .orElse(ResponseEntity.ok(ApiResponse.success("No subscription found", null)));
    }

    // ======================== ADMIN ENDPOINTS ========================

    /**
     * Admin activates a subscription for a parking lot.
     */
    @PostMapping("/api/admin/subscriptions/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subscription>> activate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ActivateRequest request) {

        Subscription sub = subscriptionService.activate(
                request.getParkingLotId(),
                request.getPlanCode(),
                principal.getId(),
                request.getDurationMonths());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subscription activated", sub));
    }

    /**
     * Admin suspends a subscription.
     */
    @PatchMapping("/api/admin/subscriptions/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subscription>> suspend(
            @PathVariable String id,
            @RequestBody(required = false) SuspendRequest request) {

        String reason = request != null ? request.getReason() : "Suspended by admin";
        Subscription sub = subscriptionService.suspend(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Subscription suspended", sub));
    }

    /**
     * Admin expires a subscription manually.
     */
    @PatchMapping("/api/admin/subscriptions/{id}/expire")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subscription>> expire(@PathVariable String id) {
        Subscription sub = subscriptionService.expire(id);
        return ResponseEntity.ok(ApiResponse.success("Subscription expired", sub));
    }

    /**
     * Admin changes a subscription to a different plan.
     */
    @PatchMapping("/api/admin/subscriptions/{id}/change-plan")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subscription>> changePlan(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ChangePlanRequest request) {

        Subscription sub = subscriptionService.changePlan(id, request.getPlanCode(), principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Subscription plan changed", sub));
    }

    /**
     * Admin views all subscriptions.
     */
    @GetMapping("/api/admin/subscriptions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Subscription>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(subscriptionService.getAll()));
    }

    // ======================== ADMIN PLAN MANAGEMENT ========================

    /**
     * Admin views all plans (including inactive).
     */
    @GetMapping("/api/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Plan>>> getAllPlansAdmin() {
        return ResponseEntity.ok(
                ApiResponse.success(subscriptionService.getAllPlansIncludingInactive()));
    }

    /**
     * Admin creates a new visibility plan.
     */
    @PostMapping("/api/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Plan>> createPlan(@RequestBody CreatePlanRequest request) {
        Plan plan = subscriptionService.createPlan(
                request.getCode(), request.getName(), request.getRadiusKm(),
                request.getPricePerMonth(), request.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plan created", plan));
    }

    /**
     * Admin updates a plan.
     */
    @PutMapping("/api/admin/plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Plan>> updatePlan(
            @PathVariable String id,
            @RequestBody UpdatePlanRequest request) {

        Plan plan = subscriptionService.updatePlan(
                id, request.getName(), request.getPricePerMonth(),
                request.getDescription(), request.getActive());
        return ResponseEntity.ok(ApiResponse.success("Plan updated", plan));
    }

    /**
     * Admin deactivates a plan.
     */
    @PatchMapping("/api/admin/plans/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Plan>> deactivatePlan(@PathVariable String id) {
        Plan plan = subscriptionService.deactivatePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deactivated", plan));
    }

    // ---- Request DTOs ----

    public static class ActivateRequest {
        private String parkingLotId;
        private String planCode;
        private int durationMonths = 1;

        public String getParkingLotId() { return parkingLotId; }
        public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
        public String getPlanCode() { return planCode; }
        public void setPlanCode(String planCode) { this.planCode = planCode; }
        public int getDurationMonths() { return durationMonths; }
        public void setDurationMonths(int durationMonths) { this.durationMonths = durationMonths; }
    }

    public static class SuspendRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class ChangePlanRequest {
        private String planCode;
        public String getPlanCode() { return planCode; }
        public void setPlanCode(String planCode) { this.planCode = planCode; }
    }

    public static class CreatePlanRequest {
        private String code;
        private String name;
        private int radiusKm;
        private double pricePerMonth;
        private String description;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getRadiusKm() { return radiusKm; }
        public void setRadiusKm(int radiusKm) { this.radiusKm = radiusKm; }
        public double getPricePerMonth() { return pricePerMonth; }
        public void setPricePerMonth(double pricePerMonth) { this.pricePerMonth = pricePerMonth; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UpdatePlanRequest {
        private String name;
        private Double pricePerMonth;
        private String description;
        private Boolean active;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Double getPricePerMonth() { return pricePerMonth; }
        public void setPricePerMonth(Double pricePerMonth) { this.pricePerMonth = pricePerMonth; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
    }
}
