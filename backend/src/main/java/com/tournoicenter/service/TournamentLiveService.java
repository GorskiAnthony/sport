package com.tournoicenter.service;

import com.tournoicenter.repository.TournamentRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/** Pushes a lightweight "something changed" ping over WebSocket to spectators watching a
 *  tournament's public page — clients react by refetching the tournament over REST, so the
 *  payload only needs to carry enough to know a refresh is worth doing.
 *
 *  "Résultats en temps réel" is only advertised for Classic/Pro (see pricing page) — a Free-plan
 *  organizer's tournament never gets a push, so its spectators only see the state from their last
 *  manual page load. The WebSocket subscribe endpoint itself stays open to everyone
 *  (StompAuthChannelInterceptor) since gating who's *allowed to listen* would need per-subscription
 *  auth for an anonymous, unauthenticated audience; gating at publish-time is simpler and has the
 *  same practical effect — a Free tournament's topic just never receives anything. */
@Service
public class TournamentLiveService {

    private final SimpMessagingTemplate messagingTemplate;
    private final TournamentRepository tournamentRepository;

    public TournamentLiveService(SimpMessagingTemplate messagingTemplate, TournamentRepository tournamentRepository) {
        this.messagingTemplate = messagingTemplate;
        this.tournamentRepository = tournamentRepository;
    }

    @Transactional(readOnly = true)
    public void notifyTournamentChanged(Long tournamentId) {
        boolean realtimeAllowed = tournamentRepository.findById(tournamentId)
                .map(tournament -> PlanLimits.of(tournament.getOrganizer().getPlan()).realtime())
                .orElse(false);
        if (!realtimeAllowed) {
            return;
        }
        messagingTemplate.convertAndSend("/topic/tournaments/" + tournamentId, (Object) Map.of("event", "UPDATED"));
    }
}
