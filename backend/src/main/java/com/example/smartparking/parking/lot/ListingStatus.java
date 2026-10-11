package com.example.smartparking.parking.lot;

/**
 * Lifecycle status of a parking lot listing.
 */
public enum ListingStatus {
    /** Newly created, awaiting owner submission */
    DRAFT,
    /** Submitted by owner, awaiting admin approval */
    PENDING_APPROVAL,
    /** Approved and active — eligible for public search */
    APPROVED,
    /** Rejected by admin */
    REJECTED,
    /** Suspended by admin */
    SUSPENDED,
    /** Deactivated by owner */
    INACTIVE
}
