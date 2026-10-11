package com.example.smartparking.search;

import com.example.smartparking.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public search controller. No authentication required.
 * Drivers search for parking by location and road-distance limit.
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * Search for parking lots near a location using road distance.
     * GET with query params for simple browser/map usage.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @Valid @ModelAttribute SearchRequest request) {

        SearchResponse response = searchService.search(request);

        if (response.getResults().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                    "No parking lots found within your search area", response));
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search via POST body (for complex filter payloads).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SearchResponse>> searchPost(
            @Valid @RequestBody SearchRequest request) {

        SearchResponse response = searchService.search(request);

        if (response.getResults().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                    "No parking lots found within your search area", response));
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
