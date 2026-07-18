package com.tournoicenter.controller;

import com.tournoicenter.config.CorsProperties;
import com.tournoicenter.dto.tournament.TournamentDetailResponse;
import com.tournoicenter.exception.ResourceNotFoundException;
import com.tournoicenter.service.TournamentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Server-rendered HTML with Open Graph / Twitter Card meta tags for a single tournament.
 * The Angular app is a pure client-rendered SPA, so link-preview crawlers (which don't run
 * JS) only ever see index.html's generic tags. nginx routes known crawler user-agents hitting
 * /t/:id here instead; real visitors keep getting the SPA untouched — see nginx.conf.
 */
@RestController
@RequestMapping("/api/share")
public class ShareController {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d MMM", Locale.FRENCH);

    private final TournamentService tournamentService;
    private final CorsProperties corsProperties;

    public ShareController(TournamentService tournamentService, CorsProperties corsProperties) {
        this.tournamentService = tournamentService;
        this.corsProperties = corsProperties;
    }

    @GetMapping(value = "/tournaments/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public String tournamentCard(@PathVariable Long id) {
        String baseUrl = corsProperties.allowedOrigin();
        String fallbackImage = baseUrl + "/hero.png";

        TournamentDetailResponse tournament;
        try {
            tournament = tournamentService.findById(id);
        } catch (ResourceNotFoundException e) {
            return render(
                    "Tournoi introuvable — Tournoi Center",
                    "Ce tournoi n'existe pas ou a été supprimé.",
                    baseUrl + "/tournaments",
                    fallbackImage
            );
        }

        String title = tournament.name() + " — Tournoi Center";
        String description = String.join(" · ",
                capitalize(tournament.sport()),
                tournament.location(),
                dateRange(tournament.startDate(), tournament.endDate()),
                teamsCountLabel(tournament.teams().size()));
        String url = baseUrl + "/t/" + tournament.id();

        return render(title, description, url, fallbackImage);
    }

    private String dateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return "Dates à venir";
        }
        return DATE_FORMAT.format(start) + " – " + DATE_FORMAT.format(end);
    }

    private String teamsCountLabel(int count) {
        return count + (count > 1 ? " équipes" : " équipe");
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private String render(String title, String description, String url, String image) {
        String safeTitle = HtmlUtils.htmlEscape(title);
        String safeDescription = HtmlUtils.htmlEscape(description);
        String safeUrl = HtmlUtils.htmlEscape(url);
        String safeImage = HtmlUtils.htmlEscape(image);

        return """
                <!doctype html>
                <html lang="fr">
                <head>
                  <meta charset="utf-8">
                  <title>%1$s</title>
                  <meta name="description" content="%2$s">
                  <link rel="canonical" href="%3$s">

                  <meta property="og:type" content="website">
                  <meta property="og:site_name" content="Tournoi Center">
                  <meta property="og:title" content="%1$s">
                  <meta property="og:description" content="%2$s">
                  <meta property="og:url" content="%3$s">
                  <meta property="og:image" content="%4$s">

                  <meta name="twitter:card" content="summary_large_image">
                  <meta name="twitter:title" content="%1$s">
                  <meta name="twitter:description" content="%2$s">
                  <meta name="twitter:image" content="%4$s">

                  <meta http-equiv="refresh" content="0; url=%3$s">
                </head>
                <body>
                  <p>Vous allez être redirigé vers <a href="%3$s">%1$s</a>.</p>
                </body>
                </html>
                """.formatted(safeTitle, safeDescription, safeUrl, safeImage);
    }
}
