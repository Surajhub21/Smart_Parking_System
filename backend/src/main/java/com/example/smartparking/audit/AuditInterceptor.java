package com.example.smartparking.audit;

import org.springframework.stereotype.Component;

/**
 * Marker component for the audit module.
 * Actual audit logging is handled by {@link AuditService}.
 * This interceptor can be extended for request-level audit tracing if needed.
 */
@Component
public class AuditInterceptor {
    // Audit logging is performed via AuditService injected into services.
    // This component exists as a future extension point for request-level tracing.
}
