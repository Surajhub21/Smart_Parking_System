package com.example.smartparking.subscription;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    List<Subscription> findByOwnerId(String ownerId);
    Optional<Subscription> findByParkingLotIdAndStatus(String parkingLotId, SubscriptionStatus status);
    List<Subscription> findByStatus(SubscriptionStatus status);
    Optional<Subscription> findByParkingLotId(String parkingLotId);
}
