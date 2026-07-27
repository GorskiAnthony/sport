package com.tournoicenter.controller;

import com.tournoicenter.TestcontainersConfiguration;
import com.tournoicenter.domain.Role;
import com.tournoicenter.repository.UserRepository;
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

/** End-to-end coverage of the admin analytics/lookup endpoints. There's no self-service path to
 *  ADMIN (registration only ever creates ORGANIZER/SPECTATOR — see RegisterRequest.resolveRole),
 *  so tests promote a registered user directly via the repository, mirroring the one-off SQL
 *  update used to grant the first real admin account in production. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

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

    private String promoteToAdminAndGetToken(String email) throws Exception {
        String token = registerAndGetToken(email, "ORGANIZER");
        var user = userRepository.findByEmail(email).orElseThrow();
        user.setRole(Role.ADMIN);
        userRepository.save(user);
        return registerAndReloginAsAdmin(email);
    }

    private String registerAndReloginAsAdmin(String email) throws Exception {
        String body = """
                {"email":"%s","password":"password1234"}
                """.formatted(email);

        String response = mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").stringValue();
    }

    private Long createTournament(String token, String name, String location) throws Exception {
        String body = """
                {"name":"%s","sport":"Football","category":"Senior","location":"%s",
                 "startDate":"2026-08-01","endDate":"2026-08-10","maxTeams":8}
                """.formatted(name, location);

        String response = mockMvc.perform(post("/api/tournaments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response).get("data");
        return json.get("id").longValue();
    }

    @Test
    void adminSeesAggregateCountsAndCanSearch() throws Exception {
        String organizerToken = registerAndGetToken("client-admin-test@example.com", "ORGANIZER");
        createTournament(organizerToken, "Coupe Admin Test", "Lyon");

        String adminToken = promoteToAdminAndGetToken("admin-admin-test@example.com");

        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.users.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.tournaments.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        mockMvc.perform(get("/api/admin/users").param("search", "client-admin-test")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].email").value("client-admin-test@example.com"))
                .andExpect(jsonPath("$.data[0].tournamentsCount").value(1));

        mockMvc.perform(get("/api/admin/tournaments").param("search", "Coupe Admin Test")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Coupe Admin Test"))
                .andExpect(jsonPath("$.data[0].organizerEmail").value("client-admin-test@example.com"));

        mockMvc.perform(get("/api/admin/locations").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void organizerCannotAccessAdminRoutes() throws Exception {
        String token = registerAndGetToken("organizer-no-admin@example.com", "ORGANIZER");

        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousCannotAccessAdminRoutes() throws Exception {
        mockMvc.perform(get("/api/admin/overview")).andExpect(status().isUnauthorized());
    }
}
