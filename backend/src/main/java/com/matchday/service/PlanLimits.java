package com.matchday.service;

import com.matchday.domain.Plan;

import java.util.Map;

/**
 * Mirrors PLAN_LIMITS from the Node reference API (types/index.ts).
 * Integer.MAX_VALUE stands in for the "Infinity" limit on CLASSIC/PRO plans.
 */
public record PlanLimits(int maxTournaments, int maxTeams, boolean realtime, boolean customRules,
                          boolean sponsorBanner, boolean buvette, boolean fairPlay, int maxConcurrent,
                          boolean tvMode, boolean checkIn) {

    public static final Map<Plan, PlanLimits> BY_PLAN = Map.of(
            Plan.FREE, new PlanLimits(1, 14, false, false, false, false, false, 50, false, false),
            Plan.CLASSIC, new PlanLimits(Integer.MAX_VALUE, Integer.MAX_VALUE, true, false, false, false, false, 500, false, true),
            Plan.PRO, new PlanLimits(Integer.MAX_VALUE, Integer.MAX_VALUE, true, true, true, true, true, 3000, true, true)
    );

    public static PlanLimits of(Plan plan) {
        return BY_PLAN.get(plan);
    }
}
