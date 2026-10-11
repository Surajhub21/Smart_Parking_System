package com.example.smartparking.search;

import com.example.smartparking.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Client for the OSRM (Open Source Routing Machine) API.
 * <p>
 * Calculates actual driving-route distance and duration between two coordinates.
 * Uses the OSRM route endpoint: GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}
 * <p>
 * If routing fails, returns empty — never silently substitutes straight-line distance.
 */
@Service
public class OsrmService {

    private static final Logger log = LoggerFactory.getLogger(OsrmService.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public OsrmService(RestTemplate restTemplate, AppProperties appProperties) {
        this.restTemplate = restTemplate;
        this.baseUrl = appProperties.getOsrm().getBaseUrl();
    }

    /**
     * Calculate driving route between two points.
     *
     * @param fromLon origin longitude
     * @param fromLat origin latitude
     * @param toLon   destination longitude
     * @param toLat   destination latitude
     * @return RouteResult with distance (meters) and duration (seconds), or empty if routing fails
     */
    public Optional<RouteResult> getRoute(double fromLon, double fromLat, double toLon, double toLat) {
        String url = String.format("%s/route/v1/driving/%f,%f;%f,%f?overview=false",
                baseUrl, fromLon, fromLat, toLon, toLat);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || !"Ok".equals(response.get("code"))) {
                log.warn("OSRM returned non-Ok response for route {},{} -> {},{}",
                        fromLon, fromLat, toLon, toLat);
                return Optional.empty();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
            if (routes == null || routes.isEmpty()) {
                log.warn("OSRM returned no routes for {},{} -> {},{}", fromLon, fromLat, toLon, toLat);
                return Optional.empty();
            }

            Map<String, Object> firstRoute = routes.get(0);
            double distanceMeters = ((Number) firstRoute.get("distance")).doubleValue();
            double durationSeconds = ((Number) firstRoute.get("duration")).doubleValue();

            return Optional.of(new RouteResult(distanceMeters, durationSeconds));

        } catch (RestClientException e) {
            log.error("OSRM request failed for {},{} -> {},{}: {}",
                    fromLon, fromLat, toLon, toLat, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Result of an OSRM route calculation.
     */
    public record RouteResult(double distanceMeters, double durationSeconds) {
        public double distanceKm() {
            return distanceMeters / 1000.0;
        }
    }
}
