import api from "./api";
import { upcomingTournaments } from "../data/mockData";

export const getUpcomingTournaments = async (limit = 3) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get(`/tournaments?upcoming=true&limit=${limit}`);
	return Promise.resolve({ data: upcomingTournaments.slice(0, limit) });
};

export const getAllTournaments = async (params = {}) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get("/tournaments", { params });
	return Promise.resolve({ data: upcomingTournaments });
};

export const getTournamentById = async (id) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get(`/tournaments/${id}`);
	const tournament = upcomingTournaments.find((t) => t.id === id);
	return Promise.resolve({ data: tournament ?? null });
};

export default { getUpcomingTournaments, getAllTournaments, getTournamentById };
