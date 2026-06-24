import { useState, useEffect, useContext } from "react";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { myTournaments, dashboardTeams, matches } from "../../data/dashboardMockData";

const TOURNAMENT_COLORS = {
	1: "bg-green-600",
	2: "bg-blue-600",
	3: "bg-purple-600",
};

function computeStandings(tournamentId) {
	const teams = dashboardTeams.filter((t) => t.tournamentId === tournamentId);
	const tournamentMatches = matches.filter((m) => m.tournamentId === tournamentId);

	const stats = {};
	teams.forEach((t) => {
		stats[t.name] = { name: t.name, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };
	});

	tournamentMatches.forEach(({ team1, team2, score1, score2 }) => {
		if (!stats[team1]) stats[team1] = { name: team1, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };
		if (!stats[team2]) stats[team2] = { name: team2, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0, pts: 0 };

		stats[team1].j++;
		stats[team2].j++;
		stats[team1].bp += score1;
		stats[team1].bc += score2;
		stats[team2].bp += score2;
		stats[team2].bc += score1;

		if (score1 > score2) {
			stats[team1].v++;
			stats[team1].pts += 3;
			stats[team2].d++;
		} else if (score1 < score2) {
			stats[team2].v++;
			stats[team2].pts += 3;
			stats[team1].d++;
		} else {
			stats[team1].n++;
			stats[team2].n++;
			stats[team1].pts++;
			stats[team2].pts++;
		}
	});

	return Object.values(stats).sort((a, b) => b.pts - a.pts || b.bp - b.bc - (a.bp - a.bc));
}

function StandingsTable({ tournament }) {
	const rows = computeStandings(tournament.id);
	const color = TOURNAMENT_COLORS[tournament.id] ?? "bg-slate-600";

	return (
		<section aria-labelledby={`tournament-${tournament.id}`} className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
			<div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<span className="text-lg" aria-hidden="true">{tournament.icon}</span>
					<p id={`tournament-${tournament.id}`} className="text-white text-sm font-semibold">{tournament.name}</p>
				</div>
				<span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
					tournament.status === "En cours"
						? "bg-green-500/20 text-green-400 border border-green-500/30"
						: "bg-amber-500/20 text-amber-400 border border-amber-500/30"
				}`}>
					{tournament.status}
				</span>
			</div>

			{rows.length === 0 ? (
				<p className="px-5 py-8 text-slate-500 text-sm text-center">Aucune équipe inscrite.</p>
			) : (
			<div className="overflow-x-auto">
				<table className="w-full text-sm min-w-[480px]" aria-label={`Classement ${tournament.name}`}>
					<thead>
						<tr className="border-b border-white/5">
							{["#", "Équipe", "J", "V", "N", "D", "BP", "BC", "Pts"].map((h) => (
								<th key={h} scope="col" className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider first:w-10 last:text-green-400">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((team, i) => (
							<tr key={team.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
								<td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-2.5">
										<span className={`w-7 h-7 ${color} rounded-full flex items-center justify-center text-[9px] font-black text-white`}>
											{team.name.slice(0, 2).toUpperCase()}
										</span>
										<span className="text-white text-xs font-medium">{team.name}</span>
									</div>
								</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.j}</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.v}</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.n}</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.d}</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.bp}</td>
								<td className="px-4 py-3 text-slate-400 text-xs">{team.bc}</td>
								<td className="px-4 py-3 text-green-400 text-xs font-bold">{team.pts}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			)}
		</section>
	);
}

function ClassementsPage() {
	const ctx = useContext(BreadcrumbContext);
	const [filter, setFilter] = useState("all");

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Classements" }]);
	}, []);

	const visible = filter === "all"
		? myTournaments
		: myTournaments.filter((t) => t.status === filter);

	return (
		<div className="max-w-5xl">
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<h1 className="text-white text-2xl font-extrabold">Classements</h1>
				<div className="flex items-center gap-1 bg-[#161B22] border border-white/5 rounded-lg p-1 overflow-x-auto" role="group" aria-label="Filtrer par statut">
					{[["all", "Tous"], ["En cours", "En cours"], ["À venir", "À venir"], ["Terminé", "Terminé"]].map(([val, label]) => (
						<button
							key={val}
							onClick={() => setFilter(val)}
							className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
								filter === val
									? "bg-green-500/20 text-green-400"
									: "text-slate-400 hover:text-white"
							}`}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			{visible.length === 0 ? (
				<div className="bg-[#161B22] border border-dashed border-white/10 rounded-2xl py-16 text-center">
					<p className="text-slate-500 text-sm">Aucun tournoi pour ce filtre.</p>
				</div>
			) : (
				<div className="space-y-5">
					{visible.map((t) => (
						<StandingsTable key={t.id} tournament={t} />
					))}
				</div>
			)}
		</div>
	);
}

export default ClassementsPage;
