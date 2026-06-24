import api from "./api";
import {
	dashboardStats,
	myTournaments,
	dashboardTeams,
	matches,
	matchDetail,
	currentUser,
} from "../data/dashboardMockData";

export const getCurrentUser = async () => {
	// TODO: return api.get("/auth/me");
	return Promise.resolve({ data: currentUser });
};

export const getDashboardStats = async () => {
	// TODO: return api.get("/dashboard/stats");
	return Promise.resolve({ data: dashboardStats });
};

export const getMyTournaments = async () => {
	// TODO: return api.get("/tournaments/mine");
	return Promise.resolve({ data: myTournaments });
};

export const getDashboardTeams = async () => {
	// TODO: return api.get("/teams");
	return Promise.resolve({ data: dashboardTeams });
};

export const addDashboardTeam = async (payload) => {
	// TODO: return api.post("/teams", payload);
	return Promise.resolve({ data: { id: Date.now(), ...payload } });
};

export const updateDashboardTeam = async (id, payload) => {
	// TODO: return api.put(`/teams/${id}`, payload);
	return Promise.resolve({ data: { id, ...payload } });
};

export const deleteDashboardTeam = async (id) => {
	// TODO: return api.delete(`/teams/${id}`);
	return Promise.resolve({ data: { success: true } });
};

export const getMatches = async () => {
	// TODO: return api.get("/matches");
	return Promise.resolve({ data: matches });
};

export const addMatch = async (payload) => {
	// TODO: return api.post("/matches", payload);
	return Promise.resolve({ data: { id: Date.now(), ...payload } });
};

export const updateMatch = async (id, payload) => {
	// TODO: return api.put(`/matches/${id}`, payload);
	return Promise.resolve({ data: { id, ...payload } });
};

export const deleteMatch = async (id) => {
	// TODO: return api.delete(`/matches/${id}`);
	return Promise.resolve({ data: { success: true } });
};

export const getMatchDetail = async (id) => {
	// TODO: return api.get(`/matches/${id}`);
	return Promise.resolve({ data: matchDetail });
};

export default {
	getCurrentUser,
	getDashboardStats,
	getMyTournaments,
	getDashboardTeams,
	addDashboardTeam,
	updateDashboardTeam,
	deleteDashboardTeam,
	getMatches,
	addMatch,
	updateMatch,
	deleteMatch,
	getMatchDetail,
};
