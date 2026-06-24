import { useEffect } from "react";
import { popularStandings } from "../../data/spectatorMockData";

function ClassementsPage() {
	useEffect(() => { document.title = "Classements — Tournoi Center"; }, []);

	return (
		<div className="max-w-3xl mx-auto px-6 py-10">
			<h1 className="text-white text-2xl font-extrabold mb-2">Classements</h1>
			<p className="text-slate-400 text-sm mb-8">Classements en temps réel de tous les tournois actifs.</p>

			<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
				<div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
					<p className="text-white text-sm font-semibold">Challenge U15 · Phase de groupes</p>
					<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">En cours</span>
				</div>
				<table className="w-full text-sm" aria-label="Classement Challenge U15">
					<thead>
						<tr className="border-b border-white/5">
							{["#", "Équipe", "J", "V", "N", "D", "Pts"].map((h) => (
								<th key={h} scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider first:w-10">{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{popularStandings.map((team) => (
							<tr key={team.rank} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
								<td className="px-5 py-3 text-slate-500 text-xs">{team.rank}</td>
								<td className="px-5 py-3">
									<div className="flex items-center gap-2.5">
										<span className={`w-7 h-7 ${team.color} ${team.textColor ?? "text-white"} rounded-full flex items-center justify-center text-[9px] font-black`}>{team.initials}</span>
										<span className="text-white text-xs font-medium">{team.name}</span>
									</div>
								</td>
								<td className="px-5 py-3 text-slate-400 text-xs">{team.points + 2}</td>
								<td className="px-5 py-3 text-slate-400 text-xs">{Math.floor(team.points / 3)}</td>
								<td className="px-5 py-3 text-slate-400 text-xs">{team.points % 3 === 0 ? 1 : 0}</td>
								<td className="px-5 py-3 text-slate-400 text-xs">{team.rank - 1}</td>
								<td className="px-5 py-3 text-green-400 text-xs font-bold">{team.points}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="mt-8 bg-[#161B22] border border-white/5 rounded-xl p-8 text-center">
				<p className="text-slate-500 text-sm">Les classements des autres tournois arrivent bientôt.</p>
			</div>
		</div>
	);
}

export default ClassementsPage;
