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

/** End-to-end coverage of the real server-side "scanned tournaments" tracking: recording a
 *  view, deduplication, auth requirements, and that the shared public tournament-detail
 *  endpoint stays publicly accessible (the design explicitly avoids threading view-recording
 *  through that shared endpoint — this is the regression guard proving that). */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TournamentViewFlowTest {

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

    private Long createTournament(String organizerToken) throws Exception {
        String body = """
                {"name":"Coupe des Scans","sport":"Football","category":"Senior","location":"Paris",
                 "startDate":"2026-08-01","endDate":"2026-08-10","maxTeams":8}
                """;

        String response = mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response).get("data");
        return json.get("id").longValue();
    }

    @Test
    void recordingTwoViewsDedupesIntoOneRecentEntry() throws Exception {
        String organizerToken = registerAndGetToken("organizer-view@example.com", "ORGANIZER");
        Long tournamentId = createTournament(organizerToken);
        String spectatorToken = registerAndGetToken("spectator-view@example.com", "SPECTATOR");

        mockMvc.perform(post("/api/tournaments/" + tournamentId + "/view")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recorded").value(true));

        mockMvc.perform(post("/api/tournaments/" + tournamentId + "/view")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tournaments/recent")
                        .header("Authorization", "Bearer " + spectatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].tournament.id").value(tournamentId))
                .andExpect(jsonPath("$.data[0].firstViewedAt").isNotEmpty())
                .andExpect(jsonPath("$.data[0].lastViewedAt").isNotEmpty());
    }

    @Test
    void anonymousCannotRecordOrListViews() throws Exception {
        String organizerToken = registerAndGetToken("organizer-view2@example.com", "ORGANIZER");
        Long tournamentId = createTournament(organizerToken);

        mockMvc.perform(post("/api/tournaments/" + tournamentId + "/view"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/tournaments/recent"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicTournamentDetailStaysAccessibleWithoutAuth() throws Exception {
        String organizerToken = registerAndGetToken("organizer-view3@example.com", "ORGANIZER");
        Long tournamentId = createTournament(organizerToken);

        mockMvc.perform(get("/api/tournaments/" + tournamentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(tournamentId));
    }
}
