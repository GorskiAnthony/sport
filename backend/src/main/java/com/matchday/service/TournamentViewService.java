package com.matchday.service;

import com.matchday.domain.TournamentView;
import com.matchday.dto.tournament.RecentTournamentResponse;
import com.matchday.repository.TournamentRepository;
import com.matchday.repository.TournamentViewRepository;
import com.matchday.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TournamentViewService {

    private final TournamentViewRepository tournamentViewRepository;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;

    public TournamentViewService(TournamentViewRepository tournamentViewRepository,
                                  UserRepository userRepository,
                                  TournamentRepository tournamentRepository) {
        this.tournamentViewRepository = tournamentViewRepository;
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
    }

    /** Records that {@code userId} viewed {@code tournamentId}, deduplicated — a repeat visit
     *  just bumps {@code lastViewedAt} on the existing row instead of creating a new one. */
    @Transactional
    public void recordView(Long userId, Long tournamentId) {
        tournamentViewRepository.findByUserIdAndTournamentId(userId, tournamentId).ifPresentOrElse(
                TournamentView::touch,
                () -> tournamentViewRepository.save(new TournamentView(
                        userRepository.getReferenceById(userId),
                        tournamentRepository.getReferenceById(tournamentId)))
        );
    }

    @Transactional(readOnly = true)
    public List<RecentTournamentResponse> findRecentlyViewed(Long userId) {
        return tournamentViewRepository.findTop10ByUserIdOrderByLastViewedAtDesc(userId).stream()
                .map(RecentTournamentResponse::from)
                .toList();
    }
}
