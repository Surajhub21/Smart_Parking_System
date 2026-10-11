package com.example.smartparking.parking.lot;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

/**
 * MongoDB repository for ParkingLot documents.
 */
public interface ParkingLotRepository extends MongoRepository<ParkingLot, String> {

    List<ParkingLot> findByOwnerId(String ownerId);

    List<ParkingLot> findByOwnerIdAndStatusNot(String ownerId, ListingStatus status);

    List<ParkingLot> findByStatus(ListingStatus status);

    long countByOwnerId(String ownerId);
}
