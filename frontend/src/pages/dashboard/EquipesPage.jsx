import { useState, useEffect, useContext } from "react";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { getDashboardTeams, deleteDashboardTeam } from "../../services/dashboardService";

const CATEGORY_STYLES = {
	U13: "bg-pink-500/20 text-pink-400",
	U15: "bg-green-500/20 text-green-400",
	U16: "bg-amber-500/20 text-amber-400",
	U17: "bg-blue-500/20 text-blue-400",
	U18: "bg-purple-500/20 text-purple-400",
	Senior: "bg-slate-500/20 text-slate-300",
};

function ActionButtons({ id, onDelete }) {
	return (
		<div className="flex items-center gap-2">
			<button
				aria-label="Modifier l'équipe"
				className="w-7 h-7 flex items-center justify-center bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-400"
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</button>
			<button
				onClick={() => onDelete(id)}
				aria-label="Supprimer l'équipe"
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

function EquipesPage() {
	const ctx = useContext(BreadcrumbContext);
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Équipes" }]);
		getDashboardTeams()
			.then(({ data }) => setTeams(data))
			.finally(() => setLoading(false));
	}, []);

	const handleDelete = async (id) => {
		await deleteDashboardTeam(id);
		setTeams((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<div className="max-w-5xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-white text-2xl font-extrabold">Équipes</h1>
				<button
					className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
				>
					+ Ajouter une équipe
				</button>
			</div>

			<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
				<table className="w-full text-sm" aria-label="Liste des équipes">
					<thead>
						<tr className="border-b border-white/5">
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Nom de l'équipe</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Catégorie</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Contact</th>
							<th scope="col" className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							[1, 2, 3, 4].map((i) => (
								<tr key={i} className="border-b border-white/5 last:border-0 animate-pulse">
									{[1, 2, 3, 4].map((j) => (
										<td key={j} className="px-5 py-4">
											<div className="h-3.5 bg-white/5 rounded w-28" />
										</td>
									))}
								</tr>
							))
						) : teams.map((t) => (
							<tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
								<td className="px-5 py-4 text-white font-medium">{t.name}</td>
								<td className="px-5 py-4">
									<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_STYLES[t.category] ?? CATEGORY_STYLES.Senior}`}>
										{t.category}
									</span>
								</td>
								<td className="px-5 py-4 text-slate-400">{t.contact}</td>
								<td className="px-5 py-4">
									<ActionButtons id={t.id} onDelete={handleDelete} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default EquipesPage;
