package com.matchday.controller;

import com.matchday.config.CorsProperties;
import com.matchday.dto.tournament.TournamentSummaryResponse;
import com.matchday.service.TournamentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * robots.txt et llms.txt générés à la demande, comme le sitemap (SitemapController) : le domaine
 * canonique n'est connu qu'à l'exécution (CorsProperties.allowedOrigin, cf. sa doc — un seul build
 * doit fonctionner derrière n'importe quel domaine), donc ni l'un ni l'autre ne peut être un fichier
 * statique dans frontend/public/ s'il doit contenir une URL absolue (ligne "Sitemap:", liens llms.txt).
 * Exposés en racine côté nginx (comme /sitemap.xml), proxifiés ici vers /api/**.
 */
@RestController
public class SeoTextController {

    private static final int LLMS_TOURNAMENT_LIMIT = 15;

    private final TournamentService tournamentService;
    private final CorsProperties corsProperties;

    public SeoTextController(TournamentService tournamentService, CorsProperties corsProperties) {
        this.tournamentService = tournamentService;
        this.corsProperties = corsProperties;
    }

    @GetMapping(value = "/api/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robots() {
        String baseUrl = corsProperties.allowedOrigin();
        return """
                User-agent: *
                Disallow: /dashboard/
                Disallow: /admin/
                Disallow: /home/
                Disallow: /register/
                Disallow: /checkout/
                Disallow: /print/
                Allow: /

                Sitemap: %s/sitemap.xml
                """.formatted(baseUrl);
    }

    @GetMapping(value = "/api/llms.txt", produces = "text/markdown")
    public String llms() {
        String baseUrl = corsProperties.allowedOrigin();
        StringBuilder md = new StringBuilder();

        md.append("# Matchday\n\n");
        md.append("> Matchday est une plateforme pour créer, gérer et suivre des tournois sportifs ")
          .append("(football, basketball, volley, tennis, e-sport et une quinzaine d'autres sports) : ")
          .append("inscription des équipes, génération du calendrier, classements et scores en temps réel, ")
          .append("page publique de suivi partageable par lien ou QR code.\n\n");

        md.append("## Pages\n\n");
        md.append("- [Accueil](").append(baseUrl).append("/) : présentation de Matchday et tournois à venir\n");
        md.append("- [Tournois](").append(baseUrl).append("/tournaments) : liste publique des tournois en cours et à venir\n");
        md.append("- [Sports](").append(baseUrl).append("/sports) : sports pris en charge sur la plateforme\n");
        md.append("- [Tarifs](").append(baseUrl).append("/pricing) : offre gratuite et abonnements payants, FAQ tarifaire\n");
        md.append("- [Organisateurs](").append(baseUrl).append("/organizers) : comment créer et gérer un tournoi\n");
        md.append("- [FAQ](").append(baseUrl).append("/faq) : questions fréquentes\n");
        md.append("- [À propos](").append(baseUrl).append("/about) : l'équipe et la mission\n\n");

        List<TournamentSummaryResponse> tournaments = tournamentService.findAll(null).stream()
                .sorted(Comparator.comparing(TournamentSummaryResponse::startDate).reversed())
                .limit(LLMS_TOURNAMENT_LIMIT)
                .toList();

        if (!tournaments.isEmpty()) {
            md.append("## Tournois récents\n\n");
            for (TournamentSummaryResponse t : tournaments) {
                String location = t.location() != null && !t.location().isBlank() ? t.location() : "lieu à venir";
                String sport = t.sport() != null ? t.sport().replace('_', ' ') : "sport non précisé";
                md.append("- [").append(t.name()).append("](").append(baseUrl).append("/t/").append(t.id()).append(") : ")
                  .append(sport).append(", ").append(location).append(", du ").append(t.startDate())
                  .append(" au ").append(t.endDate()).append("\n");
            }
            md.append('\n');
        }

        return md.toString();
    }
}
