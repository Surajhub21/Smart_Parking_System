package com.example.smartparking.subscription;

import com.example.smartparking.audit.AuditService;
import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.exception.ConflictException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.parking.lot.ParkingLot;
import com.example.smartparking.parking.lot.ParkingLotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Subscription management. Admin-managed activation in the free MVP.
 * Includes plan seeding on startup.
 * All subscription changes are recorded in the audit log.
 */
@Service
public class SubscriptionService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ParkingLotRepository lotRepository;
    private final AuditService auditService;

    public SubscriptionService(PlanRepository planRepository,
                               SubscriptionRepository subscriptionRepository,
                               ParkingLotRepository lotRepository,
                               AuditService auditService) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.lotRepository = lotRepository;
        this.auditService = auditService;
    }

    @Override
    public void run(String... args) {
        seedPlans();
    }

    /**
     * Seed default plans if not already present.
     */
    private void seedPlans() {
        if (planRepository.count() > 0) return;

        for (int km = 1; km <= 5; km++) {
            Plan plan = new Plan();
            plan.setCode("PLAN_" + km + "KM");
            plan.setName(km + " KM Visibility");
            plan.setRadiusKm(km);
            plan.setPricePerMonth(km * 500.0); // Configurable default
            plan.setDescription("Listing visible within " + km + " km road distance");
            plan.setActive(true);
            planRepository.save(plan);
        }
        log.info("Seeded 5 default visibility plans (1-5 km)");
    }

    public List<Plan> getAllPlans() {
        return planRepository.findByActiveTrue();
    }

    /**
     * Admin activates a subscription for a parking lot.
     * Looks up the parking lot to set the ownerId and validates the lot exists.
     */
    public Subscription activate(String parkingLotId, String planCode, String adminId, int durationMonths) {
        Plan plan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "code", planCode));

        // Validate parking lot exists and get owner
        ParkingLot lot = lotRepository.findById(parkingLotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", parkingLotId));

        // Check for existing active subscription
        Optional<Subscription> existing = subscriptionRepository
                .findByParkingLotIdAndStatus(parkingLotId, SubscriptionStatus.ACTIVE);
        if (existing.isPresent()) {
            throw new BadRequestException("Parking lot already has an active subscription");
        }

        Subscription sub = new Subscription();
        sub.setOwnerId(lot.getOwnerId()); // Set the owner from the parking lot
        sub.setParkingLotId(parkingLotId);
        sub.setPlanId(plan.getId());
        sub.setPlanCode(plan.getCode());
        sub.setRadiusKm(plan.getRadiusKm());
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now());
        sub.setEndDate(Instant.now().plus(durationMonths * 30L, ChronoUnit.DAYS));
        sub.setActivatedBy(adminId);

        Subscription saved = subscriptionRepository.save(sub);
        log.info("Subscription activated for lot {} with plan {} by admin {}", parkingLotId, planCode, adminId);

        // Audit log
        auditService.logAction("SUBSCRIPTION_ACTIVATED", "Subscription", saved.getId(),
                adminId, "Activated plan " + planCode + " for lot " + parkingLotId
                        + " (" + lot.getName() + ") for " + durationMonths + " month(s)");

        return saved;
    }

    /**
     * Get active subscription radius for a parking lot.
     * Returns 0 if no active subscription (listing will be excluded from search).
     */
    public int getActiveRadiusKm(String parkingLotId) {
        return subscriptionRepository
                .findByParkingLotIdAndStatus(parkingLotId, SubscriptionStatus.ACTIVE)
                .filter(sub -> sub.getEndDate() == null || sub.getEndDate().isAfter(Instant.now()))
                .map(Subscription::getRadiusKm)
                .orElse(0);
    }

    public List<Subscription> getByOwner(String ownerId) {
        return subscriptionRepository.findByOwnerId(ownerId);
    }

    public Optional<Subscription> getByParkingLot(String parkingLotId) {
        return subscriptionRepository.findByParkingLotId(parkingLotId);
    }

    /**
     * Admin suspends a subscription.
     */
    public Subscription suspend(String subscriptionId, String reason) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));
        String previousStatus = sub.getStatus().name();
        sub.setStatus(SubscriptionStatus.SUSPENDED);
        sub.setStatusReason(reason);
        Subscription saved = subscriptionRepository.save(sub);

        auditService.logAction("SUBSCRIPTION_SUSPENDED", "Subscription", subscriptionId,
                "ADMIN", "Subscription suspended: " + reason, previousStatus, "SUSPENDED");

        return saved;
    }

    /**
     * Admin expires a subscription manually.
     */
    public Subscription expire(String subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));
        String previousStatus = sub.getStatus().name();
        sub.setStatus(SubscriptionStatus.EXPIRED);
        sub.setStatusReason("Expired manually by admin");
        Subscription saved = subscriptionRepository.save(sub);

        auditService.logAction("SUBSCRIPTION_EXPIRED", "Subscription", subscriptionId,
                "ADMIN", "Subscription expired manually", previousStatus, "EXPIRED");

        return saved;
    }

    /**
     * Get all subscriptions (admin view).
     */
    public List<Subscription> getAll() {
        return subscriptionRepository.findAll();
    }

    /**
     * Admin changes a subscription to a different plan.
     * Only ACTIVE subscriptions can have their plan changed.
     */
    public Subscription changePlan(String subscriptionId, String newPlanCode, String adminId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Can only change plan for active subscriptions. Current status: " + sub.getStatus());
        }

        Plan newPlan = planRepository.findByCode(newPlanCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "code", newPlanCode));

        if (!newPlan.isActive()) {
            throw new BadRequestException("Target plan is not active: " + newPlanCode);
        }

        String previousPlan = sub.getPlanCode() + " (" + sub.getRadiusKm() + " km)";
        sub.setPlanId(newPlan.getId());
        sub.setPlanCode(newPlan.getCode());
        sub.setRadiusKm(newPlan.getRadiusKm());

        Subscription saved = subscriptionRepository.save(sub);
        log.info("Subscription {} plan changed to {} by admin {}", subscriptionId, newPlanCode, adminId);

        auditService.logAction("SUBSCRIPTION_PLAN_CHANGED", "Subscription", subscriptionId,
                adminId, "Plan changed to " + newPlanCode,
                previousPlan, newPlanCode + " (" + newPlan.getRadiusKm() + " km)");

        return saved;
    }

    /**
     * Expire all overdue subscriptions (called by scheduler).
     * Returns count of expired subscriptions.
     */
    public int expireOverdueSubscriptions() {
        Instant now = Instant.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);

        int count = 0;
        for (Subscription sub : activeSubscriptions) {
            if (sub.getEndDate() != null && sub.getEndDate().isBefore(now)) {
                String previousStatus = sub.getStatus().name();
                sub.setStatus(SubscriptionStatus.EXPIRED);
                sub.setStatusReason("Auto-expired: end date passed");
                subscriptionRepository.save(sub);

                auditService.logAction("SUBSCRIPTION_AUTO_EXPIRED", "Subscription", sub.getId(),
                        "SYSTEM", "Subscription auto-expired (end date: " + sub.getEndDate() + ")",
                        previousStatus, "EXPIRED");

                count++;
            }
        }
        return count;
    }

    // ======================== PLAN MANAGEMENT ========================

    /**
     * Get all plans including inactive (admin view).
     */
    public List<Plan> getAllPlansIncludingInactive() {
        return planRepository.findAll();
    }

    /**
     * Get a plan by ID.
     */
    public Plan getPlanById(String planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", planId));
    }

    /**
     * Admin creates a new visibility plan.
     */
    public Plan createPlan(String code, String name, int radiusKm, double pricePerMonth, String description) {
        if (planRepository.findByCode(code).isPresent()) {
            throw new ConflictException("Plan with code '" + code + "' already exists");
        }
        if (radiusKm < 1 || radiusKm > 50) {
            throw new BadRequestException("Radius must be between 1 and 50 km");
        }
        if (pricePerMonth < 0) {
            throw new BadRequestException("Price must be non-negative");
        }

        Plan plan = new Plan();
        plan.setCode(code.toUpperCase().trim());
        plan.setName(name.trim());
        plan.setRadiusKm(radiusKm);
        plan.setPricePerMonth(pricePerMonth);
        plan.setDescription(description);
        plan.setActive(true);

        Plan saved = planRepository.save(plan);
        log.info("Created plan: {} ({} km, ₹{}/month)", code, radiusKm, pricePerMonth);
        return saved;
    }

    /**
     * Admin updates a plan's details.
     */
    public Plan updatePlan(String planId, String name, Double pricePerMonth, String description, Boolean active) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", planId));

        if (name != null && !name.isBlank()) {
            plan.setName(name.trim());
        }
        if (pricePerMonth != null) {
            if (pricePerMonth < 0) {
                throw new BadRequestException("Price must be non-negative");
            }
            plan.setPricePerMonth(pricePerMonth);
        }
        if (description != null) {
            plan.setDescription(description);
        }
        if (active != null) {
            plan.setActive(active);
        }

        Plan saved = planRepository.save(plan);
        log.info("Updated plan: {} (active: {})", plan.getCode(), plan.isActive());
        return saved;
    }

    /**
     * Admin deactivates a plan. Existing subscriptions using this plan are NOT affected.
     */
    public Plan deactivatePlan(String planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", planId));
        plan.setActive(false);
        Plan saved = planRepository.save(plan);
        log.info("Deactivated plan: {}", plan.getCode());
        return saved;
    }
}
