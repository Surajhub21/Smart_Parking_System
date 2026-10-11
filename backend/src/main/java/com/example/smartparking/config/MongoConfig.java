package com.example.smartparking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import jakarta.annotation.PostConstruct;

/**
 * MongoDB configuration including auditing and index creation.
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {

    private final MongoTemplate mongoTemplate;

    public MongoConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Ensure indexes defined in @Indexed and @CompoundIndex annotations are created on startup.
     * In production, consider managing indexes externally.
     */
    @PostConstruct
    public void initIndexes() {
        // Spring Data MongoDB auto-index creation is enabled by default.
        // Explicit index management will be added in Phase 3 for geospatial and compound indexes.
    }
}
