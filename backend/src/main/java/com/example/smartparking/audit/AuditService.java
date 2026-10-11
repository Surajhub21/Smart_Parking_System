package com.example.smartparking.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for creating and querying audit log entries.
 * <p>
 * All auditable actions (subscription changes, user moderation, listing moderation)
 * should log through this service to maintain a consistent audit trail.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Log an audit event.
     */
    public AuditLog logAction(String action, String entityType, String entityId,
                              String performedBy, String description) {
        AuditLog entry = new AuditLog(action, entityType, entityId, performedBy, description);
        AuditLog saved = repository.save(entry);
        log.info("AUDIT: {} — {} on {}:{} by {}", action, description, entityType, entityId, performedBy);
        return saved;
    }

    /**
     * Log an audit event with state change detail.
     */
    public AuditLog logAction(String action, String entityType, String entityId,
                              String performedBy, String description,
                              String previousState, String newState) {
        AuditLog entry = new AuditLog(action, entityType, entityId, performedBy, description);
        entry.setPreviousState(previousState);
        entry.setNewState(newState);
        AuditLog saved = repository.save(entry);
        log.info("AUDIT: {} — {} on {}:{} by {} [{} -> {}]",
                action, description, entityType, entityId, performedBy, previousState, newState);
        return saved;
    }

    /**
     * Get audit history for a specific entity.
     */
    public List<AuditLog> getEntityHistory(String entityType, String entityId) {
        return repository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    /**
     * Get all audit entries for a specific action type.
     */
    public List<AuditLog> getByAction(String action) {
        return repository.findByActionOrderByCreatedAtDesc(action);
    }

    /**
     * Get all audit entries by a specific performer.
     */
    public List<AuditLog> getByPerformer(String performedBy) {
        return repository.findByPerformedByOrderByCreatedAtDesc(performedBy);
    }
}
