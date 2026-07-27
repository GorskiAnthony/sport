package com.tournoicenter.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.emailjs")
public record EmailJsProperties(String serviceId, String templateId, String publicKey, String privateKey) {
}
