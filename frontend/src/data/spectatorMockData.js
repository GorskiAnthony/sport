export const featuredTournaments = [
	{
		id: 1,
		name: "Champions Cup 2024",
		sport: "Football",
		scope: "Europe",
		dates: "12 Mai – 1 Jun 2024",
		teams: 32,
		status: "En cours",
		color: "from-green-900/80",
	},
	{
		id: 2,
		name: "Basketball Nations Cup",
		sport: "Basketball",
		scope: "International",
		dates: "15 Jun – 30 Jun 2024",
		teams: 16,
		status: "À venir",
		color: "from-orange-900/80",
	},
	{
		id: 3,
		name: "Esport World Series",
		sport: "Esport",
		scope: "Mondial",
		dates: "1 Mai – 15 Jun 2024",
		teams: 24,
		status: "En cours",
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
		name: "Challenge U15",
		sport: "Football",
		location: "France",
		status: "En cours",
		phase: "Phase de groupes",
		team1: { initials: "FCB", color: "bg-blue-600" },
		team2: { initials: "ASM", color: "bg-red-600" },
		score1: 2,
		score2: 1,
		hasScore: true,
	},
	{
		id: 2,
		name: "Open International de Tennis",
		sport: "Tennis",
		location: "ATP",
		status: "En cours",
		phase: "Quarts de finale",
		team1: { initials: "AM", color: "bg-slate-500" },
		team2: { initials: "RN", color: "bg-orange-600" },
		score1: null,
		score2: null,
		hasScore: false,
	},
	{
		id: 3,
		name: "Summer Basketball League",
		sport: "Basketball",
		location: "Europe",
		status: "En cours",
		phase: "Demi-finales",
		team1: { initials: "MC", color: "bg-sky-600" },
		team2: { initials: "PSG", color: "bg-blue-800" },
		score1: 68,
		score2: 72,
		hasScore: true,
	},
	{
		id: 4,
		name: "RLCS Major 2",
		sport: "Esport",
		location: "Rocket League",
		status: "En cours",
		phase: "Playoffs",
		team1: { initials: "NV", color: "bg-violet-600" },
		team2: { initials: "G2", color: "bg-slate-600" },
		score1: 3,
		score2: 2,
		hasScore: true,
	},
];

export const popularStandings = [
	{ rank: 1, initials: "FCB", color: "bg-blue-600",    name: "FC Barcelone",        points: 1895 },
	{ rank: 2, initials: "RM",  color: "bg-slate-100",   name: "Real Madrid",          points: 1870, textColor: "text-black" },
	{ rank: 3, initials: "MC",  color: "bg-sky-500",     name: "Manchester City",      points: 1840 },
	{ rank: 4, initials: "PSG", color: "bg-blue-800",    name: "Paris Saint-Germain",  points: 1832 },
	{ rank: 5, initials: "BM",  color: "bg-red-700",     name: "Bayern Munich",        points: 1820 },
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
	{ id: 1, value: "2 500+",   label: "Tournois",    icon: "🏆" },
	{ id: 2, value: "25 000+",  label: "Équipes",     icon: "👥" },
	{ id: 3, value: "500 000+", label: "Spectateurs", icon: "👤" },
	{ id: 4, value: "100+",     label: "Pays",        icon: "🌍" },
];
