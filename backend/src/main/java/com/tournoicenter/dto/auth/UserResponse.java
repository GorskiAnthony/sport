package com.tournoicenter.dto.auth;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;
import com.tournoicenter.domain.User;

public record UserResponse(Long id, String name, String email, Role role, Plan plan) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getPlan());
    }
}
