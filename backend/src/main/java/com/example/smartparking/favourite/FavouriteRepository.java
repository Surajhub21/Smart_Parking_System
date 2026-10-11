package com.example.smartparking.favourite;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface FavouriteRepository extends MongoRepository<Favourite, String> {
    List<Favourite> findByUserId(String userId);
    Optional<Favourite> findByUserIdAndParkingLotId(String userId, String parkingLotId);
    boolean existsByUserIdAndParkingLotId(String userId, String parkingLotId);
    void deleteByUserIdAndParkingLotId(String userId, String parkingLotId);
}
