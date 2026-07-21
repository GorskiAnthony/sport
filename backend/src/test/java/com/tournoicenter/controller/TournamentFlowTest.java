package com.tournoicenter.controller;

import com.tournoicenter.TestcontainersConfiguration;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage of the FREE-plan tournament limit (PlanLimitService) and
 * ownership enforcement, exercised through the real HTTP + JPA + Postgres stack.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TournamentFlowTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String registerAndGetToken(String email) throws Exception {
        String body = """
                {"name":"Organizer","email":"%s","password":"password1234"}
                """.formatted(email);

        String response = mockMvc.perform(post("/api/auth/register").contentType("application/json").content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return json.get("token").stringValue();
    }

    private String tournamentPayload(String name) {
        return """
                {"name":"%s","sport":"Football","category":"Senior","location":"Paris",
                 "startDate":"2026-08-01","endDate":"2026-08-10","maxTeams":8}
                """.formatted(name);
    }

    @Test
    void freePlanBlocksSecondTournamentWith403() throws Exception {
        String token = registerAndGetToken("organizer-plan@example.com");

        mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(tournamentPayload("Coupe de France")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(tournamentPayload("Coupe de la Ligue")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Limite de 1 tournoi(s) atteinte sur votre plan."));
    }

    @Test
    void creatingTournamentWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/tournaments")
                        .contentType("application/json")
                        .content(tournamentPayload("Sans Token")))
                .andExpect(status().isUnauthorized());
    }
}
