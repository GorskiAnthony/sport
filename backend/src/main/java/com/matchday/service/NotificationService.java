package com.matchday.service;

import com.matchday.domain.Match;
import com.matchday.domain.Notification;
import com.matchday.domain.NotificationType;
import com.matchday.domain.Team;
import com.matchday.domain.Tournament;
import com.matchday.dto.notification.NotificationResponse;
import com.matchday.exception.ForbiddenException;
import com.matchday.exception.ResourceNotFoundException;
import com.matchday.repository.NotificationRepository;
import com.matchday.repository.TeamFollowRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TeamFollowRepository teamFollowRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, TeamFollowRepository teamFollowRepository,
                                SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.teamFollowRepository = teamFollowRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findMine(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> unreadCount(Long userId) {
        return Map.of("unread", notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public void markRead(Long id, Long requesterId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable."));
        if (!notification.getUser().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
        notification.setRead(true);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> n.setRead(true));
    }

    /** Notifies every spectator following {@code team} about a tournament/match event, both
     *  persisting it (for the notifications inbox) and pushing it live over WebSocket so a
     *  spectator sees it immediately, wherever they're browsing — mirroring how tournament
     *  score updates are already pushed live. */
    @Transactional
    public void notifyFollowers(Team team, Tournament tournament, Match match, NotificationType type, String message) {
        teamFollowRepository.findByTeamId(team.getId()).forEach(follow -> {
            Notification saved = notificationRepository.save(new Notification(follow.getUser(), tournament, match, type, message));
            messagingTemplate.convertAndSend("/topic/notifications/" + follow.getUser().getId(), NotificationResponse.from(saved));
        });
    }
}
