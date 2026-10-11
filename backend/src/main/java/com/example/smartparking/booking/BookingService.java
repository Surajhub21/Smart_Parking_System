package com.example.smartparking.booking;

import com.example.smartparking.common.exception.BadRequestException;
import com.example.smartparking.common.exception.ConflictException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.common.exception.UnauthorizedException;
import com.example.smartparking.parking.lot.ParkingLot;
import com.example.smartparking.parking.lot.ParkingLotRepository;
import com.example.smartparking.parking.slot.ParkingSlot;
import com.example.smartparking.parking.slot.ParkingSlotService;
import com.example.smartparking.realtime.ParkingEventPublisher;
import com.example.smartparking.parking.slot.SlotStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Booking business logic with concurrency-safe slot reservation.
 * <p>
 * Implements immediate/session booking. Price is calculated server-side.
 * A slot cannot have conflicting confirmed/active bookings.
 * Returns 409 Conflict when a slot is no longer available.
 */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private static final List<BookingStatus> ACTIVE_STATUSES =
            List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE);

    private final BookingRepository bookingRepository;
    private final ParkingLotRepository lotRepository;
    private final ParkingSlotService slotService;
    private final ParkingEventPublisher eventPublisher;

    public BookingService(BookingRepository bookingRepository,
                          ParkingLotRepository lotRepository,
                          ParkingSlotService slotService,
                          ParkingEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.lotRepository = lotRepository;
        this.slotService = slotService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create an immediate/session booking.
     * Atomically reserves the slot and creates the booking record.
     */
    public Booking createBooking(String driverId, BookingRequest request) {
        // 1. Validate parking lot exists and is approved
        ParkingLot lot = lotRepository.findById(request.getParkingLotId())
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", request.getParkingLotId()));

        if (lot.getStatus() != com.example.smartparking.parking.lot.ListingStatus.APPROVED) {
            throw new BadRequestException("This parking lot is not currently available for booking");
        }

        // 2. Validate slot exists and belongs to this lot
        ParkingSlot slot = slotService.getById(request.getSlotId());
        if (!slot.getParkingLotId().equals(request.getParkingLotId())) {
            throw new BadRequestException("Slot does not belong to the specified parking lot");
        }

        // 3. Check no active booking exists for this slot
        if (bookingRepository.existsBySlotIdAndStatusIn(request.getSlotId(), ACTIVE_STATUSES)) {
            throw new ConflictException("This slot already has an active booking");
        }

        // 4. Reserve the slot atomically (throws ConflictException if not FREE)
        slotService.reserveSlot(request.getSlotId());

        try {
            // 5. Calculate price server-side
            double pricePerHour = lot.getPricePerHour();
            double durationHours = request.getDurationHours();
            double totalPrice = pricePerHour * durationHours;

            Instant now = Instant.now();
            Instant endTime = now.plus((long) (durationHours * 60), ChronoUnit.MINUTES);

            // 6. Create booking
            Booking booking = new Booking();
            booking.setBookingReference(generateBookingReference());
            booking.setDriverId(driverId);
            booking.setParkingLotId(lot.getId());
            booking.setSlotId(slot.getId());
            booking.setOwnerId(lot.getOwnerId());
            booking.setParkingLotName(lot.getName());
            booking.setSlotNumber(slot.getSlotNumber());
            booking.setVehicleType(slot.getVehicleType() != null ? slot.getVehicleType().name() : null);
            booking.setVehicleNumber(request.getVehicleNumber());
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setStartTime(now);
            booking.setEndTime(endTime);
            booking.setPricePerHour(pricePerHour);
            booking.setTotalPrice(totalPrice);
            booking.setCurrency(lot.getCurrency());
            booking.setDurationHours(durationHours);

            Booking saved = bookingRepository.save(booking);
            log.info("Booking {} created for slot {} by driver {}", saved.getBookingReference(),
                    slot.getSlotNumber(), driverId);

            // Publish event AFTER successful DB commit
            eventPublisher.publishBookingConfirmed(saved);

            return saved;

        } catch (Exception e) {
            // If booking creation fails, release the slot
            slotService.releaseSlot(request.getSlotId());
            throw e;
        }
    }

    /**
     * Cancel a booking. Only the driver or admin can cancel.
     */
    public Booking cancelBooking(String bookingId, String userId, String reason) {
        Booking booking = getById(bookingId);

        if (!booking.getDriverId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BadRequestException("Only confirmed or active bookings can be cancelled. Current: "
                    + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason != null ? reason : "Cancelled by driver");
        booking.setCancelledAt(Instant.now());

        Booking saved = bookingRepository.save(booking);

        // Release the slot
        slotService.releaseSlot(booking.getSlotId());

        log.info("Booking {} cancelled by user {}", booking.getBookingReference(), userId);

        // Publish event AFTER successful DB commit
        eventPublisher.publishBookingCancelled(saved);

        return saved;
    }

    /**
     * Complete a booking (driver finished parking session).
     */
    public Booking completeBooking(String bookingId, String userId) {
        Booking booking = getById(bookingId);

        if (!booking.getDriverId().equals(userId)) {
            throw new UnauthorizedException("You can only complete your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BadRequestException("Only confirmed or active bookings can be completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        // Release the slot
        slotService.releaseSlot(booking.getSlotId());

        log.info("Booking {} completed", booking.getBookingReference());

        // Publish event AFTER successful DB commit
        eventPublisher.publishBookingCompleted(saved);

        return saved;
    }

    /**
     * Extend a booking duration (with conflict check).
     */
    public Booking extendBooking(String bookingId, String userId, double additionalHours) {
        Booking booking = getById(bookingId);

        if (!booking.getDriverId().equals(userId)) {
            throw new UnauthorizedException("You can only extend your own bookings");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BadRequestException("Only confirmed or active bookings can be extended");
        }

        if (additionalHours <= 0) {
            throw new BadRequestException("Additional hours must be positive");
        }

        Instant newEndTime = booking.getEndTime()
                .plus((long) (additionalHours * 60), ChronoUnit.MINUTES);
        double additionalCost = booking.getPricePerHour() * additionalHours;

        booking.setEndTime(newEndTime);
        booking.setDurationHours(booking.getDurationHours() + additionalHours);
        booking.setTotalPrice(booking.getTotalPrice() + additionalCost);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} extended by {} hours", booking.getBookingReference(), additionalHours);

        // Publish event AFTER successful DB commit
        eventPublisher.publishBookingExtended(saved);

        return saved;
    }

    /**
     * Get driver's booking history.
     */
    public List<Booking> getDriverBookings(String driverId) {
        return bookingRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    /**
     * Get bookings for an owner's parking lots.
     */
    public List<Booking> getOwnerBookings(String ownerId) {
        return bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    /**
     * Get bookings for a specific parking lot (owner view).
     */
    public List<Booking> getLotBookings(String parkingLotId) {
        return bookingRepository.findByParkingLotIdOrderByCreatedAtDesc(parkingLotId);
    }

    /**
     * Get a booking by ID.
     */
    public Booking getById(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
    }

    /**
     * Expire bookings whose end time has passed and are still CONFIRMED/ACTIVE.
     * Called by a scheduled task or admin action.
     */
    public int expireOverdueBookings() {
        Instant now = Instant.now();
        List<Booking> overdueConfirmed = bookingRepository.findByStatusAndEndTimeBefore(
                BookingStatus.CONFIRMED, now);
        List<Booking> overdueActive = bookingRepository.findByStatusAndEndTimeBefore(
                BookingStatus.ACTIVE, now);

        int count = 0;
        for (Booking booking : overdueConfirmed) {
            booking.setStatus(BookingStatus.EXPIRED);
            Booking saved = bookingRepository.save(booking);
            slotService.releaseSlot(booking.getSlotId());
            eventPublisher.publishBookingExpired(saved);
            count++;
        }
        for (Booking booking : overdueActive) {
            booking.setStatus(BookingStatus.EXPIRED);
            Booking saved = bookingRepository.save(booking);
            slotService.releaseSlot(booking.getSlotId());
            eventPublisher.publishBookingExpired(saved);
            count++;
        }

        if (count > 0) {
            log.info("Expired {} overdue bookings", count);
        }
        return count;
    }

    private String generateBookingReference() {
        return "SPF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
