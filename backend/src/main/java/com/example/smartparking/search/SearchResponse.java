package com.example.smartparking.search;

import com.example.smartparking.parking.lot.ParkingLotResponse;

import java.util.List;

/**
 * Paginated search response with road-distance-verified results.
 */
public class SearchResponse {

    private List<ParkingLotResponse> results;
    private int page;
    private int size;
    private long totalResults;
    private int totalPages;
    /** Number of candidates excluded due to OSRM routing failure */
    private int unverifiedCount;

    public SearchResponse() {}

    public SearchResponse(List<ParkingLotResponse> results, int page, int size,
                          long totalResults, int unverifiedCount) {
        this.results = results;
        this.page = page;
        this.size = size;
        this.totalResults = totalResults;
        this.totalPages = (int) Math.ceil((double) totalResults / size);
        this.unverifiedCount = unverifiedCount;
    }

    // ---- Getters and Setters ----

    public List<ParkingLotResponse> getResults() { return results; }
    public void setResults(List<ParkingLotResponse> results) { this.results = results; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalResults() { return totalResults; }
    public void setTotalResults(long totalResults) { this.totalResults = totalResults; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public int getUnverifiedCount() { return unverifiedCount; }
    public void setUnverifiedCount(int unverifiedCount) { this.unverifiedCount = unverifiedCount; }
}
