package com.example.smartparking.favourite;

import com.example.smartparking.common.exception.ConflictException;
import com.example.smartparking.common.exception.ResourceNotFoundException;
import com.example.smartparking.parking.lot.ParkingLot;
import com.example.smartparking.parking.lot.ParkingLotRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FavouriteService {

    private final FavouriteRepository favouriteRepository;
    private final ParkingLotRepository lotRepository;

    public FavouriteService(FavouriteRepository favouriteRepository, ParkingLotRepository lotRepository) {
        this.favouriteRepository = favouriteRepository;
        this.lotRepository = lotRepository;
    }

    public Favourite addFavourite(String userId, String parkingLotId) {
        if (favouriteRepository.existsByUserIdAndParkingLotId(userId, parkingLotId)) {
            throw new ConflictException("Already in favourites");
        }
        ParkingLot lot = lotRepository.findById(parkingLotId)
                .orElseThrow(() -> new ResourceNotFoundException("ParkingLot", "id", parkingLotId));

        Favourite fav = new Favourite();
        fav.setUserId(userId);
        fav.setParkingLotId(parkingLotId);
        fav.setParkingLotName(lot.getName());
        return favouriteRepository.save(fav);
    }

    public void removeFavourite(String userId, String parkingLotId) {
        favouriteRepository.deleteByUserIdAndParkingLotId(userId, parkingLotId);
    }

    public List<Favourite> getUserFavourites(String userId) {
        return favouriteRepository.findByUserId(userId);
    }

    public boolean isFavourite(String userId, String parkingLotId) {
        return favouriteRepository.existsByUserIdAndParkingLotId(userId, parkingLotId);
    }
}
