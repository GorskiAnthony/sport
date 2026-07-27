package com.tournoicenter.controller;

import com.tournoicenter.domain.TournamentStatus;
import com.tournoicenter.dto.ApiResponse;
import com.tournoicenter.dto.admin.AdminOverviewResponse;
import com.tournoicenter.dto.admin.LocationStatsResponse;
import com.tournoicenter.dto.admin.TournamentSummaryResponse;
import com.tournoicenter.dto.admin.UserDetailResponse;
import com.tournoicenter.dto.admin.UserSummaryResponse;
import com.tournoicenter.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public ApiResponse<AdminOverviewResponse> overview() {
        return ApiResponse.of(adminService.getOverview());
    }

    @GetMapping("/users")
    public ApiResponse<List<UserSummaryResponse>> users(@RequestParam(required = false) String search) {
        return ApiResponse.of(adminService.searchUsers(search));
    }

    @GetMapping("/users/{id}")
    public ApiResponse<UserDetailResponse> userDetail(@PathVariable Long id) {
        return ApiResponse.of(adminService.getUserDetail(id));
    }

    @GetMapping("/tournaments")
    public ApiResponse<List<TournamentSummaryResponse>> tournaments(@RequestParam(required = false) String search,
                                                                     @RequestParam(required = false) TournamentStatus status) {
        return ApiResponse.of(adminService.searchTournaments(search, status));
    }

    @GetMapping("/locations")
    public ApiResponse<List<LocationStatsResponse>> locations() {
        return ApiResponse.of(adminService.getLocationStats());
    }
}
