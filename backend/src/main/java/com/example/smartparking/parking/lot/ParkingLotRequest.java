package com.example.smartparking.parking.lot;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Set;

/**
 * Request DTO for creating or updating a parking lot.
 */
public class ParkingLotRequest {

    @NotBlank(message = "Parking name is required")
    @Size(max = 150, message = "Name must be at most 150 characters")
    private String name;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    private String city;
    private String state;
    private String pincode;

    /** Latitude in [-90, 90] */
    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private Double latitude;

    /** Longitude in [-180, 180] */
    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private Double longitude;

    @Min(value = 1, message = "Total capacity must be at least 1")
    private int totalCapacity;

    @NotEmpty(message = "At least one vehicle type is required")
    private Set<VehicleType> supportedVehicles;

    private Set<Amenity> amenities;

    @DecimalMin(value = "0.0", message = "Price per hour cannot be negative")
    private double pricePerHour;

    private String operatingHours;

    private List<String> images;

    private String contactPhone;
    private String contactEmail;

    // ---- Getters and Setters ----

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

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public int getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(int totalCapacity) { this.totalCapacity = totalCapacity; }

    public Set<VehicleType> getSupportedVehicles() { return supportedVehicles; }
    public void setSupportedVehicles(Set<VehicleType> supportedVehicles) { this.supportedVehicles = supportedVehicles; }

    public Set<Amenity> getAmenities() { return amenities; }
    public void setAmenities(Set<Amenity> amenities) { this.amenities = amenities; }

    public double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(double pricePerHour) { this.pricePerHour = pricePerHour; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
}
