package com.tournoicenter.controller;

import com.tournoicenter.config.CorsProperties;
import com.tournoicenter.dto.tournament.TournamentSummaryResponse;
import com.tournoicenter.service.TournamentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Sitemap XML généré à la demande (pas de fichier statique) : les tournois sont créés en continu,
 * impossible de figer la liste au build. La protocole sitemap n'autorise que des <loc> sous le
 * répertoire du fichier sitemap lui-même — d'où l'exposition en /sitemap.xml (racine) côté nginx,
 * proxifiée vers /api/sitemap.xml ici, plutôt que de rester sous /api/**.
 */
@RestController
public class SitemapController {

    private final TournamentService tournamentService;
    private final CorsProperties corsProperties;

    private static final List<String> STATIC_PATHS = List.of(
            "", "tournaments", "teams", "sports", "pricing", "organizers", "about"
    );

    public SitemapController(TournamentService tournamentService, CorsProperties corsProperties) {
        this.tournamentService = tournamentService;
        this.corsProperties = corsProperties;
    }

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        String baseUrl = corsProperties.allowedOrigin();
        List<TournamentSummaryResponse> tournaments = tournamentService.findAll();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (String path : STATIC_PATHS) {
            xml.append(urlEntry(baseUrl + "/" + path, null));
        }
        for (TournamentSummaryResponse t : tournaments) {
            xml.append(urlEntry(baseUrl + "/t/" + t.id(), t.updatedAt() != null ? t.updatedAt() : t.createdAt()));
        }

        xml.append("</urlset>\n");
        return xml.toString();
    }

    private String urlEntry(String loc, Instant lastmod) {
        String lastmodTag = lastmod != null
                ? "    <lastmod>" + DateTimeFormatter.ISO_INSTANT.format(lastmod) + "</lastmod>\n"
                : "";
        return "  <url>\n    <loc>" + loc.replace("&", "&amp;") + "</loc>\n" + lastmodTag + "  </url>\n";
    }
}
