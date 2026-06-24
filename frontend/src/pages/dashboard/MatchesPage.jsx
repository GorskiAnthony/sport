import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { getMatches, deleteMatch } from "../../services/dashboardService";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";

function ScoreCell({ score1, score2 }) {
	const isDraw = score1 === score2;
	return (
		<span className="font-mono text-sm">
			<span className={isDraw ? "text-slate-300" : score1 > score2 ? "text-green-400 font-bold" : "text-red-400"}>
				{score1}
			</span>
			<span className="text-slate-500 mx-1">–</span>
			<span className={isDraw ? "text-slate-300" : score2 > score1 ? "text-green-400 font-bold" : "text-red-400"}>
				{score2}
			</span>
		</span>
	);
}

function ActionButtons({ id, onRequestDelete }) {
	return (
		<div className="flex items-center gap-2">
			<Link
				to={`/dashboard/matches/${id}`}
				aria-label="Modifier le match"
				className="w-7 h-7 flex items-center justify-center bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-400"
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</Link>
			<button
				onClick={() => onRequestDelete(id)}
				aria-label="Supprimer le match"
				className="w-7 h-7 flex items-center justify-center bg-slate-500/10 text-slate-400 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400"
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
					<path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
				</svg>
			</button>
		</div>
	);
}

function MatchsPage() {
	const ctx   = useContext(BreadcrumbContext);
	const toast = useToast();
	const [matchList, setMatchList] = useState([]);
	const [loading, setLoading]     = useState(true);
	const [pending, setPending]     = useState(null);

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Matchs" }]);
		getMatches()
			.then(({ data }) => setMatchList(data))
			.finally(() => setLoading(false));
	}, []);

	const confirmDelete = async () => {
		if (!pending) return;
		const { id, team1, team2, date } = pending;
		await deleteMatch(id);
		setMatchList((prev) => prev.filter((m) => m.id !== id));
		toast.success(`${team1} – ${team2} supprimé.`, "Match supprimé");
		setPending(null);
	};

	return (
		<>
		<div className="max-w-5xl">
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<h1 className="text-white text-2xl font-extrabold">Matchs</h1>
				<button className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500">
					+ Ajouter un match
				</button>
			</div>

			<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm min-w-[560px]" aria-label="Liste des matchs">
					<thead>
						<tr className="border-b border-white/5">
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Équipe 1</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Équipe 2</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Date</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Résultat</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							[1,2,3,4].map((i) => (
								<tr key={i} className="border-b border-white/5 last:border-0 animate-pulse">
									{[1,2,3,4,5].map((j) => (
										<td key={j} className="px-5 py-4">
											<div className="h-3.5 bg-white/5 rounded w-24" />
										</td>
									))}
								</tr>
							))
						) : matchList.filter(Boolean).map((m) => (
							<tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
								<td className="px-5 py-4 text-white">{m.team1}</td>
								<td className="px-5 py-4 text-slate-300 font-medium">{m.team2}</td>
								<td className="px-5 py-4 text-slate-400">{m.date}</td>
								<td className="px-5 py-4">
									<ScoreCell score1={m.score1} score2={m.score2} />
								</td>
								<td className="px-5 py-4">
									<ActionButtons
										id={m.id}
										onRequestDelete={(id) => setPending(matchList.find((x) => x.id === id))}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			</div>
		</div>

		{pending && (
			<ConfirmModal
				title="Supprimer ce match ?"
				message={`${pending.team1} – ${pending.team2} · ${pending.date}. Cette action est irréversible.`}
				onConfirm={confirmDelete}
				onClose={() => setPending(null)}
			/>
		)}
		</>
	);
}

export default MatchsPage;
