package com.tournoicenter.controller;

import com.tournoicenter.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end coverage of the enriched "followed teams" endpoint, exercised through the real
 *  HTTP + JPA + Postgres stack — this also fills a pre-existing gap, since TeamFollowService
 *  had zero integration coverage before this feature. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TeamFollowFlowTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String registerAndGetToken(String email, String role) throws Exception {
        String body = """
                {"name":"User","email":"%s","password":"password1234","role":"%s"}
                """.formatted(email, role);

        String response = mockMvc.perform(post("/api/auth/register").contentType("application/json").content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").stringValue();
    }

    private Long createTournament(String token) throws Exception {
        String body = """
                {"name":"Coupe des Favoris","sport":"Football","category":"Senior","location":"Paris",
                 "startDate":"2026-08-01","endDate":"2026-08-10","maxTeams":8}
                """;

        String response = mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("data").get("id").longValue();
    }

    private Long createTeam(String token, Long tournamentId, String name) throws Exception {
        String body = """
                {"name":"%s","category":"Senior","tournamentId":%d}
                """.formatted(name, tournamentId);

        String response = mockMvc.perform(post("/api/teams")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("data").get("id").longValue();
    }

    @Test
    void enrichedFollowedTeamsShowNextMatchOnceOneIsScheduled() throws Exception {
        String organizerToken = registerAndGetToken("organizer-follow@example.com", "ORGANIZER");
        Long tournamentId = createTournament(organizerToken);
        Long followedTeamId = createTeam(organizerToken, tournamentId, "Équipe Suivie");
        Long opponentTeamId = createTeam(organizerToken, tournamentId, "Adversaire");

        String spectatorToken = registerAndGetToken("spectator-follow@example.com", "SPECTATOR");
        mockMvc.perform(post("/api/teams/" + followedTeamId + "/follow")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teams/followed/enriched")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].team.id").value(followedTeamId))
                .andExpect(jsonPath("$.data[0].tournamentName").value("Coupe des Favoris"))
                .andExpect(jsonPath("$.data[0].nextMatch").isEmpty())
                .andExpect(jsonPath("$.data[0].lastMatch").isEmpty());

        String matchBody = """
                {"tournamentId":%d,"homeTeamId":%d,"awayTeamId":%d,"phase":"Poule unique","date":"2026-08-05T10:00:00Z"}
                """.formatted(tournamentId, followedTeamId, opponentTeamId);
        mockMvc.perform(post("/api/matches")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType("application/json")
                        .content(matchBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teams/followed/enriched")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].nextMatch").isNotEmpty())
                .andExpect(jsonPath("$.data[0].nextMatch.phase").value("Poule unique"));
    }

    @Test
    void anonymousCannotAccessEnrichedFollowedTeams() throws Exception {
        mockMvc.perform(get("/api/teams/followed/enriched")).andExpect(status().isUnauthorized());
    }
}
