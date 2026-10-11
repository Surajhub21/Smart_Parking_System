package com.example.smartparking.audit;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

/**
 * MongoDB repository for AuditLog documents.
 */
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);

    List<AuditLog> findByPerformedByOrderByCreatedAtDesc(String performedBy);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);
}
