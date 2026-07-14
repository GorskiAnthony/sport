package com.tournoicenter.security;

import com.tournoicenter.domain.Plan;
import com.tournoicenter.domain.Role;

public record JwtPrincipal(Long userId, String email, Role role, Plan plan) {
}
