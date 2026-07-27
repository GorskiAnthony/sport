package com.tournoicenter.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * The public {@code /topic/tournaments/{id}} broadcast is intentionally open — spectators watch a
 * tournament's live page without signing in. {@code /topic/notifications/{userId}} carries a
 * specific user's private events, so it needs its own check: without this interceptor, anything
 * that can open a STOMP connection (the {@code /api/ws} handshake is {@code permitAll()}) could
 * subscribe to any user's channel just by guessing an id.
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String NOTIFICATIONS_PREFIX = "/topic/notifications/";

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscription(accessor);
        }

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtService.parseToken(header.substring(7))
                    .ifPresent(principal -> accessor.setUser(new StompPrincipal(principal)));
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(NOTIFICATIONS_PREFIX)) {
            return;
        }

        String requestedUserId = destination.substring(NOTIFICATIONS_PREFIX.length());
        if (!(accessor.getUser() instanceof StompPrincipal principal)
                || !principal.jwtPrincipal().userId().toString().equals(requestedUserId)) {
            throw new AccessDeniedException("Not authorized for this notification channel.");
        }
    }
}
