package com.example.smartparking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for Smart Parking Finder API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI smartParkingOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Parking Finder API")
                        .version("1.0.0")
                        .description("REST API for the Smart Parking Finder platform — "
                                + "discover parking using road distance, manage listings, "
                                + "reserve slots, and receive live updates.")
                        .contact(new Contact()
                                .name("Smart Parking Team")
                                .email("support@smartparking.example.com"))
                        .license(new License()
                                .name("MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local development server")
                ));
    }
}
