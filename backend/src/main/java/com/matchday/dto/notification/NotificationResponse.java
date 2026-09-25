package com.matchday.dto.notification;

import com.matchday.domain.Notification;
import com.matchday.domain.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String message,
        boolean read,
        Long tournamentId,
        Long matchId,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getTournament().getId(),
                notification.getMatch() != null ? notification.getMatch().getId() : null,
                notification.getCreatedAt()
        );
    }
}
