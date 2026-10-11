package com.example.smartparking.subscription;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task that automatically expires subscriptions whose endDate has passed.
 * Runs every 30 minutes to find active subscriptions with an expired endDate
 * and marks them EXPIRED. This ensures listings with lapsed subscriptions
 * are automatically removed from public search eligibility.
 */
@Component
public class SubscriptionScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionScheduler.class);

    private final SubscriptionService subscriptionService;

    public SubscriptionScheduler(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Expire active subscriptions whose endDate has passed.
     * Runs every 30 minutes.
     */
    @Scheduled(fixedRate = 1_800_000) // 30 minutes
    public void expireOverdueSubscriptions() {
        try {
            int expired = subscriptionService.expireOverdueSubscriptions();
            if (expired > 0) {
                log.info("Scheduled expiry: {} subscriptions auto-expired", expired);
            }
        } catch (Exception e) {
            log.error("Scheduled subscription expiry failed: {}", e.getMessage());
        }
    }
}
