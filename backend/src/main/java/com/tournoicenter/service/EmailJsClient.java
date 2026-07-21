package com.tournoicenter.service;

import com.tournoicenter.config.EmailJsProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Sends transactional email via EmailJS's server-to-server REST API (using the account's private
 * key, which bypasses EmailJS's browser-origin check) rather than the browser SDK — this keeps the
 * reset token server-side instead of handing it back to whoever calls /forgot-password.
 */
@Service
public class EmailJsClient {

    private static final Logger log = LoggerFactory.getLogger(EmailJsClient.class);
    private static final String ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

    private final EmailJsProperties properties;
    private final RestClient restClient = RestClient.create();

    public EmailJsClient(EmailJsProperties properties) {
        this.properties = properties;
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        Map<String, Object> body = Map.of(
                "service_id", properties.serviceId(),
                "template_id", properties.templateId(),
                "user_id", properties.publicKey(),
                "accessToken", properties.privateKey(),
                "template_params", Map.of("to_email", toEmail, "reset_link", resetLink)
        );

        try {
            restClient.post().uri(ENDPOINT).body(body).retrieve().toBodilessEntity();
        } catch (Exception e) {
            // Never propagate — the caller must see the same generic success regardless of whether
            // the email actually went out, or a delivery failure would leak account existence.
            log.error("Failed to send password reset email via EmailJS", e);
        }
    }
}
