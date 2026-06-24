import {
	dashboardTeams,
	myTournaments,
	matches,
	matchDetail,
	currentUser,
} from "../data/dashboardMockData";
import { K, read, write, getOrSeed } from "../utils/localStore";

export const getCurrentUser = async () =>
	Promise.resolve({ data: currentUser });

export const getDashboardStats = async () => {
	const tournaments = getOrSeed(K.tournaments, myTournaments);
	const teams       = getOrSeed(K.teams, dashboardTeams);
	return Promise.resolve({
		data: [
			{ id: 1, value: tournaments.length, label: "Mes tournois" },
			{ id: 2, value: teams.length,        label: "Équipes" },
			{ id: 3, value: matches.length,      label: "Matchs" },
			{ id: 4, value: 64,                  label: "Joueurs" },
		],
	});
};

export const getMyTournaments = async () =>
	Promise.resolve({ data: getOrSeed(K.tournaments, myTournaments) });

export const getDashboardTeams = async (tournamentId) => {
	const all = getOrSeed(K.teams, dashboardTeams);
	const result = tournamentId !== undefined
		? all.filter((t) => t.tournamentId === tournamentId)
		: all;
	return Promise.resolve({ data: result });
};

export const addDashboardTeam = async (payload) => {
	const all    = getOrSeed(K.teams, dashboardTeams);
	const newTeam = { id: Date.now(), ...payload };
	write(K.teams, [...all, newTeam]);
	return Promise.resolve({ data: newTeam });
};

export const updateDashboardTeam = async (id, payload) => {
	const all     = getOrSeed(K.teams, dashboardTeams);
	const updated = all.map((t) => (t.id === id ? { ...t, ...payload } : t));
	write(K.teams, updated);
	return Promise.resolve({ data: { id, ...payload } });
};

export const deleteDashboardTeam = async (id) => {
	const all = getOrSeed(K.teams, dashboardTeams);
	write(K.teams, all.filter((t) => t.id !== id));
	return Promise.resolve({ data: { success: true } });
};

const EMPTY_STATS = {
	possession1: 50, possession2: 50,
	shots1: 0, shots2: 0, shotsOnTarget1: 0, shotsOnTarget2: 0,
	corners1: 0, corners2: 0, fouls1: 0, fouls2: 0,
	yellowCards1: 0, yellowCards2: 0, redCards1: 0, redCards2: 0,
};

function enrichMatch(m) {
	return {
		time: "15:00", venue: "", status: "Terminé",
		events: [], lineup1: [], lineup2: [],
		stats: { ...EMPTY_STATS },
		comments: [],
		...m,
	};
}

export const getMatches = async () => {
	const all = getOrSeed(K.matches, matches.map(enrichMatch));
	return Promise.resolve({ data: all });
};

export const getMatchById = async (id) => {
	const all   = getOrSeed(K.matches, matches.map(enrichMatch));
	const found = all.find((m) => String(m.id) === String(id));
	return Promise.resolve({ data: found ? { ...enrichMatch({}), ...found } : null });
};

export const addMatch = async (payload) => {
	const all  = getOrSeed(K.matches, matches.map(enrichMatch));
	const newM = enrichMatch({ id: Date.now(), ...payload });
	write(K.matches, [...all, newM]);
	return Promise.resolve({ data: newM });
};

export const updateMatch = async (id, payload) => {
	const all     = getOrSeed(K.matches, matches.map(enrichMatch));
	const updated = all.map((m) => String(m.id) === String(id) ? { ...m, ...payload } : m);
	write(K.matches, updated);
	return Promise.resolve({ data: { id, ...payload } });
};

export const deleteMatch = async (id) => {
	const all = getOrSeed(K.matches, matches.map(enrichMatch));
	write(K.matches, all.filter((m) => String(m.id) !== String(id)));
	return Promise.resolve({ data: { success: true } });
};

export const getMatchDetail = async () =>
	Promise.resolve({ data: matchDetail });

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
