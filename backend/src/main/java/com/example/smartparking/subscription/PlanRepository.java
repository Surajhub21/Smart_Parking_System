package com.example.smartparking.subscription;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface PlanRepository extends MongoRepository<Plan, String> {
    Optional<Plan> findByCode(String code);
    List<Plan> findByActiveTrue();
}
