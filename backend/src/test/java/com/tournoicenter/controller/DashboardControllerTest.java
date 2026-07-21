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

/** End-to-end coverage of the organizer stats aggregate endpoint, exercised through the real
 *  HTTP + JPA + Postgres stack — a FREE-plan organizer's real tournament/team counts must be
 *  reflected accurately, and the plan's enforced limit (1 tournament) must be surfaced too. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String registerAndGetToken(String email) throws Exception {
        String body = """
                {"name":"Organizer","email":"%s","password":"password1234","role":"ORGANIZER"}
                """.formatted(email);

        String response = mockMvc.perform(post("/api/auth/register").contentType("application/json").content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").stringValue();
    }

    private Long createTournament(String token) throws Exception {
        String body = """
                {"name":"Coupe du Dashboard","sport":"Football","category":"Senior","location":"Paris",
                 "startDate":"2026-08-01","endDate":"2026-08-10","maxTeams":8}
                """;

        String response = mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response).get("data");
        return json.get("id").longValue();
    }

    private void createTeam(String token, Long tournamentId, String name) throws Exception {
        String body = """
                {"name":"%s","category":"Senior","tournamentId":%d}
                """.formatted(name, tournamentId);

        mockMvc.perform(post("/api/teams")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void reflectsRealCountsAndFreePlanLimit() throws Exception {
        String token = registerAndGetToken("organizer-dash@example.com");
        Long tournamentId = createTournament(token);
        createTeam(token, tournamentId, "Team A");
        createTeam(token, tournamentId, "Team B");

        mockMvc.perform(get("/api/dashboard/organizer").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tournaments.total").value(1))
                .andExpect(jsonPath("$.data.tournaments.upcoming").value(1))
                .andExpect(jsonPath("$.data.teamsCount").value(2))
                .andExpect(jsonPath("$.data.matches.total").value(0))
                .andExpect(jsonPath("$.data.plan.plan").value("FREE"))
                .andExpect(jsonPath("$.data.plan.maxTournaments").value(1))
                .andExpect(jsonPath("$.data.plan.usedTournaments").value(1));
    }

    @Test
    void anonymousCannotAccessOrganizerStats() throws Exception {
        mockMvc.perform(get("/api/dashboard/organizer")).andExpect(status().isUnauthorized());
    }
}
