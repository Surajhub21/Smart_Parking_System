package com.example.smartparking.favourite;

import com.example.smartparking.common.response.ApiResponse;
import com.example.smartparking.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favourites")
@PreAuthorize("hasRole('DRIVER')")
public class FavouriteController {

    private final FavouriteService service;

    public FavouriteController(FavouriteService service) {
        this.service = service;
    }

    @PostMapping("/{parkingLotId}")
    public ResponseEntity<ApiResponse<Favourite>> add(
            @PathVariable String parkingLotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Favourite fav = service.addFavourite(principal.getId(), parkingLotId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Added to favourites", fav));
    }

    @DeleteMapping("/{parkingLotId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable String parkingLotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        service.removeFavourite(principal.getId(), parkingLotId);
        return ResponseEntity.ok(ApiResponse.success("Removed from favourites"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Favourite>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(service.getUserFavourites(principal.getId())));
    }

    @GetMapping("/{parkingLotId}/check")
    public ResponseEntity<ApiResponse<Boolean>> check(
            @PathVariable String parkingLotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(service.isFavourite(principal.getId(), parkingLotId)));
    }
}
