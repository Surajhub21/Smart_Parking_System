package com.example.smartparking.booking;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * MongoDB repository for Booking documents.
 */
public interface BookingRepository extends MongoRepository<Booking, String> {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByDriverIdOrderByCreatedAtDesc(String driverId);

    List<Booking> findByParkingLotIdOrderByCreatedAtDesc(String parkingLotId);

    List<Booking> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    List<Booking> findBySlotIdAndStatusIn(String slotId, List<BookingStatus> statuses);

    List<Booking> findByStatusAndEndTimeBefore(BookingStatus status, Instant time);

    boolean existsBySlotIdAndStatusIn(String slotId, List<BookingStatus> statuses);
}
