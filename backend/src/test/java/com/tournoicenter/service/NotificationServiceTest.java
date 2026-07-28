package com.tournoicenter.service;

import com.tournoicenter.domain.Notification;
import com.tournoicenter.domain.NotificationType;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.TeamFollow;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.domain.User;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.NotificationRepository;
import com.tournoicenter.repository.TeamFollowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private TeamFollowRepository teamFollowRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationRepository, teamFollowRepository, messagingTemplate);
    }

    private User user(Long id) {
        User user = new User("spectator@example.com", "hash", "Spectateur", Role.SPECTATOR);
        setId(user, id);
        return user;
    }

    private Tournament tournament() {
        return new Tournament("Cup", "football", "u15", "Lyon",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), 14, null);
    }

    private Team team() {
        return new Team("Team A", "u15", tournament());
    }

    /** Reflection helper — User.id has no public setter, and only a persisted (repository-loaded)
     *  entity would normally have one, which isn't practical to construct in a pure unit test. */
    private static void setId(User user, Long id) {
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void findMineMapsRepositoryResults() {
        Notification notification = new Notification(user(1L), tournament(), null, NotificationType.MATCH_STARTED, "Début !");
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(notification));

        assertThat(service.findMine(1L)).hasSize(1);
    }

    @Test
    void unreadCountReflectsRepository() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        assertThat(service.unreadCount(1L)).containsEntry("unread", 3L);
    }

    @Test
    void markReadRejectsWhenRequesterIsNotTheOwner() {
        Notification notification = new Notification(user(1L), tournament(), null, NotificationType.MATCH_STARTED, "Début !");
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> service.markRead(5L, 2L)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void markReadRejectsUnknownNotification() {
        when(notificationRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(5L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllReadMarksEveryNotificationForUser() {
        Notification a = new Notification(user(1L), tournament(), null, NotificationType.MATCH_FINISHED, "Fin !");
        Notification b = new Notification(user(1L), tournament(), null, NotificationType.MATCH_STARTED, "Début !");
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(a, b));

        service.markAllRead(1L);

        assertThat(a.isRead()).isTrue();
        assertThat(b.isRead()).isTrue();
    }

    @Test
    void notifyFollowersPersistsAndPushesToEveryFollower() {
        Team team = team();
        TeamFollow follow1 = new TeamFollow(user(1L), team);
        TeamFollow follow2 = new TeamFollow(user(2L), team);
        when(teamFollowRepository.findByTeamId(team.getId())).thenReturn(List.of(follow1, follow2));
        when(notificationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.notifyFollowers(team, team.getTournament(), null, NotificationType.MATCH_STARTED, "Team A a commencé !");

        verify(notificationRepository, times(2)).save(any(Notification.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/1"), any(Object.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/2"), any(Object.class));
    }
}
