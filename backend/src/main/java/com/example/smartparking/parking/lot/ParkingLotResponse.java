package com.example.smartparking.parking.lot;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Response DTO for a parking lot. Never exposes the raw document directly.
 */
public class ParkingLotResponse {

    private String id;
    private String ownerId;
    private String name;
    private String description;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private double latitude;
    private double longitude;
    private int totalCapacity;
    private int availableSlots;
    private Set<VehicleType> supportedVehicles;
    private Set<Amenity> amenities;
    private double pricePerHour;
    private String currency;
    private String operatingHours;
    private ListingStatus status;
    private String statusReason;
    private Instant availabilityLastUpdated;
    private List<String> images;
    private String contactPhone;
    private String contactEmail;
    private Instant createdAt;
    private Instant updatedAt;

    /** Road distance in meters — populated during search only */
    private Double roadDistanceMeters;
    /** Route duration in seconds — populated during search only */
    private Double routeDurationSeconds;

    public ParkingLotResponse() {}

    /**
     * Map from ParkingLot document to response DTO.
     */
    public static ParkingLotResponse fromEntity(ParkingLot lot) {
        ParkingLotResponse r = new ParkingLotResponse();
        r.setId(lot.getId());
        r.setOwnerId(lot.getOwnerId());
        r.setName(lot.getName());
        r.setDescription(lot.getDescription());
        r.setAddress(lot.getAddress());
        r.setCity(lot.getCity());
        r.setState(lot.getState());
        r.setPincode(lot.getPincode());
        if (lot.getLocation() != null) {
            // GeoJSON Point stores [longitude, latitude] — expose as lat/lon for UI
            r.setLongitude(lot.getLocation().getX());
            r.setLatitude(lot.getLocation().getY());
        }
        r.setTotalCapacity(lot.getTotalCapacity());
        r.setAvailableSlots(lot.getAvailableSlots());
        r.setSupportedVehicles(lot.getSupportedVehicles());
        r.setAmenities(lot.getAmenities());
        r.setPricePerHour(lot.getPricePerHour());
        r.setCurrency(lot.getCurrency());
        r.setOperatingHours(lot.getOperatingHours());
        r.setStatus(lot.getStatus());
        r.setStatusReason(lot.getStatusReason());
        r.setAvailabilityLastUpdated(lot.getAvailabilityLastUpdated());
        r.setImages(lot.getImages());
        r.setContactPhone(lot.getContactPhone());
        r.setContactEmail(lot.getContactEmail());
        r.setCreatedAt(lot.getCreatedAt());
        r.setUpdatedAt(lot.getUpdatedAt());
        return r;
    }

    // ---- Getters and Setters ----

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public int getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(int totalCapacity) { this.totalCapacity = totalCapacity; }

    public int getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(int availableSlots) { this.availableSlots = availableSlots; }

    public Set<VehicleType> getSupportedVehicles() { return supportedVehicles; }
    public void setSupportedVehicles(Set<VehicleType> supportedVehicles) { this.supportedVehicles = supportedVehicles; }

    public Set<Amenity> getAmenities() { return amenities; }
    public void setAmenities(Set<Amenity> amenities) { this.amenities = amenities; }

    public double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(double pricePerHour) { this.pricePerHour = pricePerHour; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public ListingStatus getStatus() { return status; }
    public void setStatus(ListingStatus status) { this.status = status; }

    public String getStatusReason() { return statusReason; }
    public void setStatusReason(String statusReason) { this.statusReason = statusReason; }

    public Instant getAvailabilityLastUpdated() { return availabilityLastUpdated; }
    public void setAvailabilityLastUpdated(Instant availabilityLastUpdated) { this.availabilityLastUpdated = availabilityLastUpdated; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Double getRoadDistanceMeters() { return roadDistanceMeters; }
    public void setRoadDistanceMeters(Double roadDistanceMeters) { this.roadDistanceMeters = roadDistanceMeters; }

    public Double getRouteDurationSeconds() { return routeDurationSeconds; }
    public void setRouteDurationSeconds(Double routeDurationSeconds) { this.routeDurationSeconds = routeDurationSeconds; }
}
