import { upcomingTournaments } from "../data/mockData";
import { K, read, write, getOrSeed } from "../utils/localStore";
import { myTournaments } from "../data/dashboardMockData";

const SPORT_ICONS = {
	football: "⚽", futsal: "⚽", basketball: "🏀", handball: "🤾",
	volleyball: "🏐", rugby: "🏉", tennis: "🎾", esport: "🎮",
};

export const getUpcomingTournaments = async (limit = 3) =>
	Promise.resolve({ data: upcomingTournaments.slice(0, limit) });

export const getAllTournaments = async () =>
	Promise.resolve({ data: upcomingTournaments });

export const getTournamentById = async (id) => {
	const tournament = upcomingTournaments.find((t) => t.id === id);
	return Promise.resolve({ data: tournament ?? null });
};

export const createTournament = async (payload) => {
	const all    = getOrSeed(K.tournaments, myTournaments);
	const newT   = {
		id:     Date.now(),
		icon:   SPORT_ICONS[payload.sport] ?? "🏆",
		status: "À venir",
		teams:  0,
		...payload,
	};
	write(K.tournaments, [...all, newT]);
	return Promise.resolve({ data: newT });
};

export default { getUpcomingTournaments, getAllTournaments, getTournamentById, createTournament };
