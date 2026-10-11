package com.example.smartparking.parking.lot;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * MongoDB document representing a parking facility.
 * <p>
 * Location is stored as GeoJSON Point: [longitude, latitude].
 * A 2dsphere index is created on the location field for geospatial queries.
 */
@Document(collection = "parking_lots")
public class ParkingLot {

    @Id
    private String id;

    /** Owner's user ID — enforced on every operation */
    @Indexed
    private String ownerId;

    private String name;

    private String description;

    private String address;

    private String city;

    private String state;

    private String pincode;

    /** GeoJSON Point: [longitude, latitude] */
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;

    private int totalCapacity;

    /** Currently reported available slots (derived from slot states) */
    private int availableSlots;

    private Set<VehicleType> supportedVehicles;

    private Set<Amenity> amenities;

    /** Price per hour in INR */
    private double pricePerHour;

    private String currency = "INR";

    /** Operating hours, e.g. "06:00-22:00" or "24/7" */
    private String operatingHours;

    private ListingStatus status = ListingStatus.DRAFT;

    /** Admin rejection or suspension reason */
    private String statusReason;

    /** Last time availability was reported/updated */
    private Instant availabilityLastUpdated;

    private List<String> images = new ArrayList<>();

    private String contactPhone;

    private String contactEmail;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public ParkingLot() {}

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

    public GeoJsonPoint getLocation() { return location; }
    public void setLocation(GeoJsonPoint location) { this.location = location; }

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
}
