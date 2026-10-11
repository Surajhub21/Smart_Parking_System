package com.example.smartparking.audit;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document for audit trail entries.
 * Records who did what, when, and on which entity.
 */
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    /** The action performed (e.g. SUBSCRIPTION_ACTIVATED, USER_SUSPENDED) */
    @Indexed
    private String action;

    /** The entity type affected (e.g. Subscription, User, ParkingLot) */
    private String entityType;

    /** The ID of the affected entity */
    @Indexed
    private String entityId;

    /** Who performed the action (user ID or "SYSTEM") */
    @Indexed
    private String performedBy;

    /** Human-readable description of what happened */
    private String description;

    /** Previous state snapshot (JSON or key fields) */
    private String previousState;

    /** New state snapshot */
    private String newState;

    @CreatedDate
    private Instant createdAt;

    public AuditLog() {}

    public AuditLog(String action, String entityType, String entityId,
                    String performedBy, String description) {
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.performedBy = performedBy;
        this.description = description;
    }

    // ---- Getters and Setters ----

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPreviousState() { return previousState; }
    public void setPreviousState(String previousState) { this.previousState = previousState; }

    public String getNewState() { return newState; }
    public void setNewState(String newState) { this.newState = newState; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
