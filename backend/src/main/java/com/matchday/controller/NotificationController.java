package com.matchday.controller;

import com.matchday.dto.ApiResponse;
import com.matchday.dto.notification.NotificationResponse;
import com.matchday.security.JwtPrincipal;
import com.matchday.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> findMine(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(notificationService.findMine(principal.userId()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(@AuthenticationPrincipal JwtPrincipal principal) {
        return ApiResponse.of(notificationService.unreadCount(principal.userId()));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Map<String, Boolean>> markRead(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable Long id) {
        notificationService.markRead(id, principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Map<String, Boolean>> markAllRead(@AuthenticationPrincipal JwtPrincipal principal) {
        notificationService.markAllRead(principal.userId());
        return ApiResponse.of(Map.of("success", true));
    }
}
