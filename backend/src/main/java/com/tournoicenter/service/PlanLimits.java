package com.tournoicenter.service;

import com.tournoicenter.domain.Plan;

import java.util.Map;

/**
 * Mirrors PLAN_LIMITS from the Node reference API (types/index.ts).
 * Integer.MAX_VALUE stands in for the "Infinity" limit on CLASSIC/PRO plans.
 */
public record PlanLimits(int maxTournaments, int maxTeams, boolean realtime, boolean customRules, int maxConcurrent) {

    public static final Map<Plan, PlanLimits> BY_PLAN = Map.of(
            Plan.FREE, new PlanLimits(1, 14, false, false, 50),
            Plan.CLASSIC, new PlanLimits(Integer.MAX_VALUE, Integer.MAX_VALUE, true, false, 500),
            Plan.PRO, new PlanLimits(Integer.MAX_VALUE, Integer.MAX_VALUE, true, true, 3000)
    );

    public static PlanLimits of(Plan plan) {
        return BY_PLAN.get(plan);
    }
}
