package com.example.smartparking.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Custom application properties bound from application.yml under "app".
 */
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Cors cors = new Cors();
    private Osrm osrm = new Osrm();
    private Search search = new Search();

    // ---- Nested classes ----

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Osrm {
        private String baseUrl = "http://localhost:5000";

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    }

    public static class Search {
        private double straightLineBufferMultiplier = 1.5;
        private int maxStraightLineBufferMeters = 10000;

        public double getStraightLineBufferMultiplier() { return straightLineBufferMultiplier; }
        public void setStraightLineBufferMultiplier(double v) { this.straightLineBufferMultiplier = v; }
        public int getMaxStraightLineBufferMeters() { return maxStraightLineBufferMeters; }
        public void setMaxStraightLineBufferMeters(int v) { this.maxStraightLineBufferMeters = v; }
    }

    // ---- Accessors ----

    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }

    public Osrm getOsrm() { return osrm; }
    public void setOsrm(Osrm osrm) { this.osrm = osrm; }

    public Search getSearch() { return search; }
    public void setSearch(Search search) { this.search = search; }
}
