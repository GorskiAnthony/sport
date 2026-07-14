package com.tournoicenter.service;

import com.tournoicenter.domain.Match;
import com.tournoicenter.domain.MatchStatus;
import com.tournoicenter.domain.Team;
import com.tournoicenter.domain.Tournament;
import com.tournoicenter.dto.match.MatchRequest;
import com.tournoicenter.dto.match.MatchResponse;
import com.tournoicenter.dto.match.MatchScoreRequest;
import com.tournoicenter.exception.ForbiddenException;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.repository.MatchRepository;
import com.tournoicenter.repository.TeamRepository;
import com.tournoicenter.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public MatchService(MatchRepository matchRepository, TournamentRepository tournamentRepository, TeamRepository teamRepository) {
        this.matchRepository = matchRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> findByTournament(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByDateAsc(tournamentId).stream().map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MatchResponse findById(Long id) {
        return MatchResponse.from(getOrThrow(id));
    }

    @Transactional
    public MatchResponse create(Long requesterId, MatchRequest request) {
        Tournament tournament = tournamentRepository.findById(request.tournamentId())
                .orElseThrow(() -> new ResourceNotFoundException("Tournoi introuvable."));
        if (!tournament.getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }

        Team homeTeam = teamRepository.findById(request.homeTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Équipe (domicile) introuvable."));
        Team awayTeam = teamRepository.findById(request.awayTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Équipe (extérieur) introuvable."));

        Match match = new Match(tournament, homeTeam, awayTeam, request.phase(), request.date());
        match.setVenue(request.venue());
        match.setHomeScore(request.homeScore());
        match.setAwayScore(request.awayScore());

        return MatchResponse.from(matchRepository.save(match));
    }

    @Transactional
    public MatchResponse updateScore(Long id, Long requesterId, MatchScoreRequest request) {
        Match match = getOrThrow(id);
        requireOwner(match, requesterId);

        match.setHomeScore(request.homeScore());
        match.setAwayScore(request.awayScore());
        match.setStatus(MatchStatus.FINISHED);

        return MatchResponse.from(match);
    }

    @Transactional
    public void delete(Long id, Long requesterId) {
        Match match = getOrThrow(id);
        requireOwner(match, requesterId);
        matchRepository.delete(match);
    }

    private Match getOrThrow(Long id) {
        return matchRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Match introuvable."));
    }

    private void requireOwner(Match match, Long requesterId) {
        if (!match.getTournament().getOrganizer().getId().equals(requesterId)) {
            throw new ForbiddenException();
        }
    }
}
