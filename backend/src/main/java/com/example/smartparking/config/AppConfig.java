package com.example.smartparking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * General application beans.
 */
@Configuration
public class AppConfig {

    /**
     * RestTemplate used for OSRM and external HTTP calls.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
