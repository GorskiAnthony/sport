package com.tournoicenter.controller;

import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.dashboard.OrganizerDashboardResponse;
import com.tournoicenter.security.JwtPrincipal;
import com.tournoicenter.service.DashboardService;
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
