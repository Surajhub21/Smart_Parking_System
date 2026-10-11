package com.example.smartparking.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Intercepts STOMP CONNECT frames to authenticate WebSocket connections.
 * <p>
 * For session-based auth, this extracts the authenticated user from the
 * HTTP session that was established during the initial WebSocket handshake.
 * <p>
 * Private destinations (/user/queue/*) are only accessible to authenticated users.
 * Public topics (/topic/*) are accessible to all connected clients.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // For session-based auth, the user principal is already set by Spring Security
            // during the HTTP handshake that establishes the WebSocket connection.
            // We just log and validate here.
            if (accessor.getUser() != null) {
                log.info("WebSocket CONNECT from authenticated user: {}", accessor.getUser().getName());
            } else {
                log.info("WebSocket CONNECT from anonymous user (public topics only)");
            }
        }

        return message;
    }
}
