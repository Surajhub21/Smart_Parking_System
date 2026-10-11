package com.example.smartparking.subscription;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Configurable visibility plan definition (1km–5km).
 * Admin-managed. Seeded on startup.
 */
@Document(collection = "plans")
public class Plan {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code; // e.g. "PLAN_1KM"

    private String name; // e.g. "1 KM Visibility"
    private int radiusKm; // 1, 2, 3, 4, 5
    private double pricePerMonth; // INR
    private String currency = "INR";
    private boolean active = true;
    private String description;

    public Plan() {}

    // ---- Getters and Setters ----
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getRadiusKm() { return radiusKm; }
    public void setRadiusKm(int radiusKm) { this.radiusKm = radiusKm; }
    public double getPricePerMonth() { return pricePerMonth; }
    public void setPricePerMonth(double pricePerMonth) { this.pricePerMonth = pricePerMonth; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
