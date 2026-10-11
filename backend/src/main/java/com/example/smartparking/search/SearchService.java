package com.example.smartparking.search;

import com.example.smartparking.config.AppProperties;
import com.example.smartparking.parking.lot.ListingStatus;
import com.example.smartparking.parking.lot.ParkingLot;
import com.example.smartparking.parking.lot.ParkingLotResponse;
import com.example.smartparking.subscription.SubscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Two-stage parking search using MongoDB 2dsphere + OSRM road distance.
 * <p>
 * Stage 1: MongoDB geospatial query to shortlist candidates within a straight-line buffer.
 * Stage 2: OSRM route calculation to verify actual road distance for each candidate.
 * <p>
 * The straight-line shortlist is ONLY a performance optimization. It is never the final
 * road-distance eligibility check. Routing failure never silently becomes a straight-line match.
 */
@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);

    private final MongoTemplate mongoTemplate;
    private final OsrmService osrmService;
    private final AppProperties appProperties;
    private final SubscriptionService subscriptionService;

    public SearchService(MongoTemplate mongoTemplate, OsrmService osrmService,
                         AppProperties appProperties, SubscriptionService subscriptionService) {
        this.mongoTemplate = mongoTemplate;
        this.osrmService = osrmService;
        this.appProperties = appProperties;
        this.subscriptionService = subscriptionService;
    }

    /**
     * Execute a two-stage parking search.
     *
     * @param request validated search parameters
     * @return paginated, road-distance-sorted results
     */
    public SearchResponse search(SearchRequest request) {
        double driverLat = request.getLatitude();
        double driverLon = request.getLongitude();
        double driverRadiusKm = request.getRadiusKm();

        // ---- Stage 1: MongoDB geospatial pre-filter ----
        double bufferMultiplier = appProperties.getSearch().getStraightLineBufferMultiplier();
        int maxBufferMeters = appProperties.getSearch().getMaxStraightLineBufferMeters();

        double straightLineBufferKm = Math.min(
                driverRadiusKm * bufferMultiplier,
                maxBufferMeters / 1000.0
        );

        // GeoJSON Point uses [longitude, latitude]
        Point searchPoint = new Point(driverLon, driverLat);
        Distance maxDistance = new Distance(straightLineBufferKm, Metrics.KILOMETERS);

        Query query = new Query();
        query.addCriteria(Criteria.where("location")
                .nearSphere(searchPoint)
                .maxDistance(maxDistance.getNormalizedValue()));
        query.addCriteria(Criteria.where("status").is(ListingStatus.APPROVED));

        // Apply optional filters
        if (request.getVehicleType() != null) {
            query.addCriteria(Criteria.where("supportedVehicles").in(request.getVehicleType()));
        }
        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            query.addCriteria(Criteria.where("amenities").all(request.getAmenities()));
        }
        if (request.getMaxPricePerHour() != null) {
            query.addCriteria(Criteria.where("pricePerHour").lte(request.getMaxPricePerHour()));
        }
        if (Boolean.TRUE.equals(request.getAvailableOnly())) {
            query.addCriteria(Criteria.where("availableSlots").gt(0));
        }

        List<ParkingLot> candidates = mongoTemplate.find(query, ParkingLot.class);

        log.info("Stage 1: Found {} geospatial candidates within {} km straight-line buffer",
                candidates.size(), straightLineBufferKm);

        // ---- Stage 2: OSRM road-distance verification ----
        List<ParkingLotResponse> verifiedResults = new ArrayList<>();
        int unverifiedCount = 0;

        for (ParkingLot lot : candidates) {
            if (lot.getLocation() == null) {
                unverifiedCount++;
                continue;
            }

            double lotLon = lot.getLocation().getX();
            double lotLat = lot.getLocation().getY();

            Optional<OsrmService.RouteResult> routeOpt =
                    osrmService.getRoute(driverLon, driverLat, lotLon, lotLat);

            if (routeOpt.isEmpty()) {
                // Routing failed — do NOT substitute straight-line distance
                unverifiedCount++;
                log.debug("Routing failed for lot {}, excluding from results", lot.getId());
                continue;
            }

            OsrmService.RouteResult route = routeOpt.get();
            double roadDistanceKm = route.distanceKm();

            // Check against driver's search limit
            if (roadDistanceKm > driverRadiusKm) {
                continue;
            }

            // Phase 8: Check against owner's subscription plan radius
            // eligibleRoadDistanceKm <= min(driverSearchLimitKm, ownerPlanRadiusKm)
            int ownerPlanRadiusKm = subscriptionService.getActiveRadiusKm(lot.getId());
            if (ownerPlanRadiusKm <= 0) {
                // No active subscription — listing is ineligible for public search
                log.debug("Lot {} excluded: no active subscription", lot.getId());
                continue;
            }
            if (roadDistanceKm > ownerPlanRadiusKm) {
                // Beyond owner's paid visibility radius
                log.debug("Lot {} excluded: road distance {} km exceeds plan radius {} km",
                        lot.getId(), roadDistanceKm, ownerPlanRadiusKm);
                continue;
            }

            ParkingLotResponse response = ParkingLotResponse.fromEntity(lot);
            response.setRoadDistanceMeters(route.distanceMeters());
            response.setRouteDurationSeconds(route.durationSeconds());
            verifiedResults.add(response);
        }

        // Sort by road distance ascending
        verifiedResults.sort(Comparator.comparingDouble(r ->
                r.getRoadDistanceMeters() != null ? r.getRoadDistanceMeters() : Double.MAX_VALUE));

        // Paginate
        long totalResults = verifiedResults.size();
        int fromIndex = Math.min(request.getPage() * request.getSize(), verifiedResults.size());
        int toIndex = Math.min(fromIndex + request.getSize(), verifiedResults.size());
        List<ParkingLotResponse> pageResults = verifiedResults.subList(fromIndex, toIndex);

        log.info("Stage 2: {} verified results, {} unverified, returning page {} of {}",
                totalResults, unverifiedCount, request.getPage(), (int) Math.ceil((double) totalResults / request.getSize()));

        return new SearchResponse(pageResults, request.getPage(), request.getSize(),
                totalResults, unverifiedCount);
    }
}
