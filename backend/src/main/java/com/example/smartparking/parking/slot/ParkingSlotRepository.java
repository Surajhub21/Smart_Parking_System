package com.example.smartparking.parking.slot;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * MongoDB repository for ParkingSlot documents.
 */
public interface ParkingSlotRepository extends MongoRepository<ParkingSlot, String> {

    List<ParkingSlot> findByParkingLotId(String parkingLotId);

    List<ParkingSlot> findByParkingLotIdAndStatus(String parkingLotId, SlotStatus status);

    List<ParkingSlot> findByOwnerId(String ownerId);

    Optional<ParkingSlot> findByParkingLotIdAndSlotNumber(String parkingLotId, String slotNumber);

    long countByParkingLotId(String parkingLotId);

    long countByParkingLotIdAndStatus(String parkingLotId, SlotStatus status);

    boolean existsByParkingLotIdAndSlotNumber(String parkingLotId, String slotNumber);
}
