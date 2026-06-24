export const featuredTournaments = [
	{
		id: 1,
		name: "Challenge U15 Lyon",
		sport: "Football",
		scope: "Auvergne-Rhône-Alpes",
		dates: "24 – 26 Mai 2024",
		teams: 8,
		status: "En cours",
		color: "from-green-900/80",
	},
	{
		id: 2,
		name: "Cup de la Bretagne U18",
		sport: "Football",
		scope: "Bretagne",
		dates: "30 Mai – 1 Jun 2024",
		teams: 12,
		status: "À venir",
		color: "from-orange-900/80",
	},
	{
		id: 3,
		name: "Paris Soccer Cup U15",
		sport: "Football",
		scope: "Île-de-France",
		dates: "7 – 8 Jun 2024",
		teams: 8,
		status: "À venir",
		color: "from-purple-900/80",
	},
];

export const sportCategories = [
	{ id: "football",    label: "Football",    icon: "⚽" },
	{ id: "basketball",  label: "Basketball",  icon: "🏀" },
	{ id: "tennis",      label: "Tennis",      icon: "🎾" },
	{ id: "volleyball",  label: "Volleyball",  icon: "🏐" },
	{ id: "rugby",       label: "Rugby",       icon: "🏉" },
	{ id: "esport",      label: "Esport",      icon: "🎮" },
	{ id: "handball",    label: "Handball",    icon: "🤾" },
	{ id: "autres",      label: "Autres",      icon: "···" },
];

export const liveTournaments = [
	{
		id: 1,
		name: "Challenge U15 Lyon",
		sport: "Football",
		location: "Lyon",
		status: "En cours",
		phase: "Phase de groupes",
		team1: { initials: "FCL", color: "bg-blue-600" },
		team2: { initials: "ASM", color: "bg-red-600" },
		score1: 2,
		score2: 1,
		hasScore: true,
	},
	{
		id: 2,
		name: "Cup de la Bretagne U18",
		sport: "Football",
		location: "Rennes",
		status: "En cours",
		phase: "Quarts de finale",
		team1: { initials: "SR",  color: "bg-slate-500" },
		team2: { initials: "PFC", color: "bg-orange-600" },
		score1: null,
		score2: null,
		hasScore: false,
	},
	{
		id: 3,
		name: "Tournoi National U17",
		sport: "Football",
		location: "Marseille",
		status: "En cours",
		phase: "Demi-finales",
		team1: { initials: "OM",  color: "bg-sky-300", textColor: "text-black" },
		team2: { initials: "PFC", color: "bg-blue-800" },
		score1: 0,
		score2: 1,
		hasScore: true,
	},
	{
		id: 4,
		name: "Paris Soccer Cup U15",
		sport: "Football",
		location: "Paris",
		status: "En cours",
		phase: "Finale",
		team1: { initials: "FCN", color: "bg-yellow-600" },
		team2: { initials: "LOSC", color: "bg-red-800", fontSize: "text-[7px]" },
		score1: 1,
		score2: 1,
		hasScore: true,
	},
];

export const popularStandings = [
	{ rank: 1, initials: "FCL", color: "bg-blue-600",  name: "FC Lyon",         points: 18 },
	{ rank: 2, initials: "ASM", color: "bg-red-600",   name: "AS Monaco",       points: 15 },
	{ rank: 3, initials: "PFC", color: "bg-sky-500",   name: "Paris FC",        points: 12 },
	{ rank: 4, initials: "OM",  color: "bg-sky-300",   name: "OM Academy",      points: 9,  textColor: "text-black" },
	{ rank: 5, initials: "SR",  color: "bg-slate-600", name: "Stade Rennais",   points: 6 },
];

export const upcomingEvents = [
	{ id: 1, day: "24", month: "MAI", name: "Finale Challenge U15",         location: "Lyon, France",  time: "14:00" },
	{ id: 2, day: "26", month: "MAI", name: "Demi-finale Basketball League", location: "Paris, France", time: "18:30" },
	{ id: 3, day: "28", month: "MAI", name: "Finale Esport World Series",    location: "En ligne",      time: "20:00" },
];

export const latestNews = [
	{
		id: 1,
		sport: "Football",
		title: "Le calendrier complet de la Coupe du Monde 2026 dévoilé",
		time: "Il y a 2 heures",
	},
];

export const spectatorStats = [
	{ id: 1, value: "8",   label: "Tournois",  icon: "🏆" },
	{ id: 2, value: "42",  label: "Équipes",   icon: "👥" },
	{ id: 3, value: "310", label: "Joueurs",   icon: "👤" },
	{ id: 4, value: "3",   label: "Régions",   icon: "📍" },
];
