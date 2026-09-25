package com.matchday.controller;

import com.matchday.dto.ApiResponse;
import com.matchday.dto.dashboard.OrganizerDashboardResponse;
import com.matchday.security.JwtPrincipal;
import com.matchday.service.DashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/organizer")
    public ApiResponse<OrganizerDashboardResponse> organizerStats(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(dashboardService.getOrganizerStats(principal.userId()));
    }
}
