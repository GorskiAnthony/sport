import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { getDashboardStats, getMyTournaments } from "../../services/dashboardService";

const STATUS_STYLES = {
	"En cours": "bg-green-500/20 text-green-400",
	"À venir":  "bg-amber-500/20 text-amber-400",
	"Terminé":  "bg-slate-500/20 text-slate-400",
};

function StatCard({ value, label, loading }) {
	if (loading) {
		return (
			<div className="bg-[#161B22] border border-white/5 rounded-xl p-5 animate-pulse">
				<div className="h-9 bg-white/5 rounded w-16 mb-2" />
				<div className="h-3 bg-white/5 rounded w-24" />
			</div>
		);
	}
	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-5">
			<p className="text-green-400 text-3xl font-extrabold">{value}</p>
			<p className="text-slate-400 text-sm mt-1">{label}</p>
		</div>
	);
}

function TournamentRow({ id, icon, name, dates, location, status }) {
	return (
		<Link
			to={`/dashboard/tournois`}
			className="flex items-center justify-between px-5 py-4 bg-[#161B22] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors duration-200 group"
			aria-label={`${name} — ${status}`}
		>
			<div className="flex items-center gap-4">
				<span className="text-2xl" aria-hidden="true">{icon}</span>
				<div>
					<p className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">{name}</p>
					<p className="text-slate-500 text-xs mt-0.5">{dates} · {location}</p>
				</div>
			</div>
			<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[status] ?? STATUS_STYLES["À venir"]}`}>
				{status}
			</span>
		</Link>
	);
}

function DashboardPage() {
	const ctx = useContext(BreadcrumbContext);
	const [stats, setStats] = useState([]);
	const [tournaments, setTournaments] = useState([]);
	const [loadingStats, setLoadingStats] = useState(true);
	const [loadingTournaments, setLoadingTournaments] = useState(true);

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Tableau de bord" }]);
		getDashboardStats()
			.then(({ data }) => setStats(data))
			.finally(() => setLoadingStats(false));
		getMyTournaments()
			.then(({ data }) => setTournaments(data))
			.finally(() => setLoadingTournaments(false));
	}, []);

	return (
		<div className="max-w-5xl space-y-8">
			<h1 className="text-white text-2xl font-extrabold">Tableau de bord</h1>

			{/* Stat cards */}
			<ul className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Statistiques">
				{loadingStats
					? [1, 2, 3, 4].map((i) => <li key={i}><StatCard loading /></li>)
					: stats.map((s) => (
							<li key={s.id}><StatCard value={s.value} label={s.label} /></li>
					  ))}
			</ul>

			{/* My tournaments */}
			<section aria-labelledby="my-tournaments-heading">
				<div className="flex items-center justify-between mb-4">
					<h2 id="my-tournaments-heading" className="text-white font-semibold text-base">
						Mes tournois
					</h2>
					<Link
						to="/dashboard/tournois"
						className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
					>
						+ Créer un tournoi
					</Link>
				</div>

				{loadingTournaments ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="bg-[#161B22] border border-white/5 rounded-xl p-5 animate-pulse flex items-center gap-4">
								<div className="w-8 h-8 bg-white/5 rounded" />
								<div className="flex-1 space-y-2">
									<div className="h-3.5 bg-white/5 rounded w-1/3" />
									<div className="h-3 bg-white/5 rounded w-1/4" />
								</div>
							</div>
						))}
					</div>
				) : (
					<ul className="space-y-3" role="list">
						{tournaments.map((t) => (
							<li key={t.id}><TournamentRow {...t} /></li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

export default DashboardPage;
