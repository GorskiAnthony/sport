export const currentUser = {
	id: 1,
	name: "Jean Dupont",
	initials: "JD",
	email: "jean.dupont@email.fr",
	role: "organisateur",
};

export const dashboardStats = [
	{ id: 1, value: 3,   label: "Mes tournois" },
	{ id: 2, value: 24,  label: "Équipes" },
	{ id: 3, value: 48,  label: "Matchs" },
	{ id: 4, value: 128, label: "Joueurs" },
];

export const myTournaments = [
	{
		id: 1,
		icon: "🏆",
		name: "Challenge U15",
		dates: "24 – 26 Mai 2024",
		location: "Lyon, France",
		status: "En cours",
		category: "U15",
		sport: "Football",
		teams: 16,
	},
	{
		id: 2,
		icon: "⚽",
		name: "Cup de la Bretagne U16",
		dates: "30 Mai – 1 Jun 2024",
		location: "Rennes, France",
		status: "À venir",
		category: "U16",
		sport: "Football",
		teams: 12,
	},
	{
		id: 3,
		icon: "📖",
		name: "Paris Soccer Cup U15",
		dates: "7 – 9 Jun 2024",
		location: "Paris, France",
		status: "À venir",
		category: "U15",
		sport: "Football",
		teams: 8,
	},
];

export const dashboardTeams = [
	{ id: 1, name: "FC Lyon",     category: "U15", contact: "contact@fcl.fr",  tournamentId: 1 },
	{ id: 2, name: "AS Monaco",   category: "U15", contact: "contact@asm.fr",  tournamentId: 1 },
	{ id: 3, name: "Paris FC",    category: "U17", contact: "contact@pfc.fr",  tournamentId: 2 },
	{ id: 4, name: "OM Academy",  category: "U16", contact: "contact@om.fr",   tournamentId: 2 },
	{ id: 5, name: "FC Nantes",   category: "U15", contact: "contact@fcn.fr",  tournamentId: 1 },
	{ id: 6, name: "Stade Rennais", category: "U15", contact: "contact@sr.fr", tournamentId: 1 },
	{ id: 7, name: "LOSC",        category: "U17", contact: "contact@losc.fr", tournamentId: 2 },
	{ id: 8, name: "OL Academy",  category: "U16", contact: "contact@ol.fr",   tournamentId: 2 },
];

export const matches = [
	{ id: 1, team1: "Paris FC",    team2: "OM Academy",     date: "24 Mai 2024", score1: 2, score2: 1, tournamentId: 1, phase: "Phase de groupes" },
	{ id: 2, team1: "Paris FC",    team2: "OM Academy",     date: "24 Mai 2024", score1: 0, score2: 0, tournamentId: 1, phase: "Phase de groupes" },
	{ id: 3, team1: "FC Nantes",   team2: "Stade Rennais",  date: "25 Mai 2024", score1: 1, score2: 3, tournamentId: 1, phase: "Phase de groupes" },
	{ id: 4, team1: "LOSC",        team2: "OL Academy",     date: "25 Mai 2024", score1: 2, score2: 0, tournamentId: 2, phase: "Phase de groupes" },
	{ id: 5, team1: "FC Lyon",     team2: "AS Monaco",      date: "26 Mai 2024", score1: 2, score2: 1, tournamentId: 1, phase: "Demi-finale" },
	{ id: 6, team1: "Stade Rennais", team2: "Paris FC",     date: "26 Mai 2024", score1: 0, score2: 2, tournamentId: 1, phase: "Demi-finale" },
];

export const matchDetail = {
	id: 5,
	phase: "Demi-finale",
	tournamentId: 1,
	tournament: "Challenge U15",
	date: "24 Mai 2024",
	time: "19:00",
	venue: "Stade de Lyon",
	status: "Terminé",
	team1: { id: 1, name: "FC Lyon",   emoji: "🦊", score: 2 },
	team2: { id: 2, name: "AS Monaco", emoji: "⚡", score: 1 },
	events: [
		{ id: 1, minute: 15, type: "But", team: "FC Lyon",   icon: "⚽" },
		{ id: 2, minute: 47, type: "But", team: "AS Monaco", icon: "⚽" },
		{ id: 3, minute: 78, type: "But", team: "FC Lyon",   icon: "⚽" },
	],
};
