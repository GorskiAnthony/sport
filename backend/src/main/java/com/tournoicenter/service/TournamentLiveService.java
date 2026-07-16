package com.tournoicenter.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/** Pushes a lightweight "something changed" ping over WebSocket to spectators watching a
 *  tournament's public page — clients react by refetching the tournament over REST, so the
 *  payload only needs to carry enough to know a refresh is worth doing. */
@Service
public class TournamentLiveService {

    private final SimpMessagingTemplate messagingTemplate;

    public TournamentLiveService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyTournamentChanged(Long tournamentId) {
        messagingTemplate.convertAndSend("/topic/tournaments/" + tournamentId, (Object) Map.of("event", "UPDATED"));
    }
}
