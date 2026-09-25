package com.matchday.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;

/** Browser clients can no longer set the STOMP CONNECT frame's Authorization header — the JWT
 *  sits in an httpOnly cookie they can't read (see AuthCookieService). The WebSocket upgrade is
 *  still a normal HTTP request though, so it carries that cookie automatically; this interceptor
 *  reads it during the handshake and stashes the raw token in the WS session attributes for
 *  StompAuthChannelInterceptor to resolve at CONNECT time. Native mobile is unaffected — it
 *  keeps authenticating via the STOMP frame's own Authorization header. */
@Component
public class JwtHandshakeCookieInterceptor implements HandshakeInterceptor {

    public static final String TOKEN_ATTRIBUTE = "cookieJwtToken";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return true;
        }
        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        Cookie[] cookies = httpRequest.getCookies();
        if (cookies == null) {
            return true;
        }
        Arrays.stream(cookies)
                .filter(cookie -> AuthCookieService.COOKIE_NAME.equals(cookie.getName()))
                .findFirst()
                .ifPresent(cookie -> attributes.put(TOKEN_ATTRIBUTE, cookie.getValue()));
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Exception exception) {
        // No-op.
    }
}
