package com.example.smartparking.realtime;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket/STOMP configuration with SockJS fallback.
 * <p>
 * Public topics:
 * - /topic/lots/{lotId}/slots   — slot status changes for a specific parking lot
 * - /topic/lots/{lotId}/availability — availability summary updates
 * <p>
 * Private (user-specific) destinations:
 * - /user/queue/bookings   — booking events for the authenticated user
 * <p>
 * Rules from the master plan:
 * - Publish events only after successful database commit.
 * - Authenticate connections and authorize private destinations.
 * - Do not broadcast private booking information to unauthorized clients.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;

    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for topic and queue destinations
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages bound to @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific (private) destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add authentication interceptor for STOMP CONNECT frames
        registration.interceptors(authInterceptor);
    }
}
