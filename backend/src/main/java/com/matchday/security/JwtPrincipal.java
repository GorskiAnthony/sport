package com.matchday.security;

import com.matchday.domain.Plan;
import com.matchday.domain.Role;

public record JwtPrincipal(Long userId, String email, Role role, Plan plan, String tokenId) {
}
