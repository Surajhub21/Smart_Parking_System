package com.example.smartparking.favourite;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Driver's favourite parking lot. Unique index on { userId, parkingLotId }.
 */
@Document(collection = "favourites")
@CompoundIndex(name = "user_lot_unique", def = "{'userId': 1, 'parkingLotId': 1}", unique = true)
public class Favourite {

    @Id
    private String id;
    private String userId;
    private String parkingLotId;
    private String parkingLotName;

    @CreatedDate
    private Instant createdAt;

    public Favourite() {}

    // ---- Getters and Setters ----
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(String parkingLotId) { this.parkingLotId = parkingLotId; }
    public String getParkingLotName() { return parkingLotName; }
    public void setParkingLotName(String parkingLotName) { this.parkingLotName = parkingLotName; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
