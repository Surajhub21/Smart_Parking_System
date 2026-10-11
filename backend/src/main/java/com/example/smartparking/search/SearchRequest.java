package com.example.smartparking.search;

import com.example.smartparking.parking.lot.Amenity;
import com.example.smartparking.parking.lot.VehicleType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

/**
 * Request DTO for parking search.
 * Driver provides their location and search preferences.
 */
public class SearchRequest {

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private Double longitude;

    /** Driver's selected road-distance limit in km (1-10) */
    @NotNull(message = "Search radius is required")
    @Min(value = 1, message = "Search radius must be at least 1 km")
    @Max(value = 10, message = "Search radius must be at most 10 km")
    private Double radiusKm;

    // ---- Optional filters ----

    private VehicleType vehicleType;
    private Set<Amenity> amenities;
    private Double maxPricePerHour;
    private Boolean availableOnly;

    /** Pagination */
    @Min(value = 0)
    private int page = 0;

    @Min(value = 1)
    @Max(value = 50)
    private int size = 20;

    // ---- Getters and Setters ----

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getRadiusKm() { return radiusKm; }
    public void setRadiusKm(Double radiusKm) { this.radiusKm = radiusKm; }

    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }

    public Set<Amenity> getAmenities() { return amenities; }
    public void setAmenities(Set<Amenity> amenities) { this.amenities = amenities; }

    public Double getMaxPricePerHour() { return maxPricePerHour; }
    public void setMaxPricePerHour(Double maxPricePerHour) { this.maxPricePerHour = maxPricePerHour; }

    public Boolean getAvailableOnly() { return availableOnly; }
    public void setAvailableOnly(Boolean availableOnly) { this.availableOnly = availableOnly; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}
