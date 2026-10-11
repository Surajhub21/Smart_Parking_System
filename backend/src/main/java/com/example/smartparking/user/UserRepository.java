package com.example.smartparking.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

/**
 * MongoDB repository for User documents.
 */
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
