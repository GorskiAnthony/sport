package com.tournoicenter.security;

import java.security.Principal;

/** Wraps the JWT claims validated at STOMP CONNECT time so later frames (e.g. SUBSCRIBE) on the
 *  same session can check who's actually connected, via {@link org.springframework.messaging.Message}'s
 *  user header. */
public record StompPrincipal(JwtPrincipal jwtPrincipal) implements Principal {
    @Override
    public String getName() {
        return String.valueOf(jwtPrincipal.userId());
    }
}
