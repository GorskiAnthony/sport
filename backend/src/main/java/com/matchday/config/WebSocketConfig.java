package com.matchday.config;

import com.matchday.security.JwtHandshakeCookieInterceptor;
import com.matchday.security.StompAuthChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/** Broadcasts live match/bracket updates to spectators watching a tournament's public page,
 *  under /api/ws so it rides the same nginx reverse-proxy path as the REST API. */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final CorsProperties corsProperties;
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final JwtHandshakeCookieInterceptor jwtHandshakeCookieInterceptor;

    public WebSocketConfig(CorsProperties corsProperties, StompAuthChannelInterceptor stompAuthChannelInterceptor,
                            JwtHandshakeCookieInterceptor jwtHandshakeCookieInterceptor) {
        this.corsProperties = corsProperties;
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
        this.jwtHandshakeCookieInterceptor = jwtHandshakeCookieInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws")
                .setAllowedOrigins(corsProperties.corsAllowedOrigins().toArray(String[]::new))
                .addInterceptors(jwtHandshakeCookieInterceptor);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
