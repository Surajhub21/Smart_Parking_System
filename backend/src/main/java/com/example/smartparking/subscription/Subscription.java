package com.example.smartparking.subscription;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Owner subscription to a visibility plan. Admin-managed in the MVP.
 */
@Document(collection = "subscriptions")
public class Subscription {

    @Id
    private String id;

    @Indexed
    private String ownerId;

    @Indexed
    private String parkingLotId;

    private String planId;
    private String planCode;
    private int radiusKm;

    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    private Instant startDate;
    private Instant endDate;

    /** Who activated/changed this subscription */
    private String activatedBy;
    private String statusReason;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Subscription() {}

    // ---- Getters and Setters ----
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }
    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }
    public int getRadiusKm() { return radiusKm; }
    public void setRadiusKm(int radiusKm) { this.radiusKm = radiusKm; }
    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public String getActivatedBy() { return activatedBy; }
    public void setActivatedBy(String activatedBy) { this.activatedBy = activatedBy; }
    public String getStatusReason() { return statusReason; }
    public void setStatusReason(String statusReason) { this.statusReason = statusReason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
