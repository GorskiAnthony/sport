import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { getTeams } from "../services/teamService";

function TeamCard({ name, category, players, city, coach, wins, losses }) {
	const total = wins + losses;
	const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

	return (
		<article className="bg-[#161B22] border border-white/5 rounded-xl p-5 hover:border-green-500/30 transition-colors duration-300">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-base flex-shrink-0" aria-hidden="true">
					{name.charAt(0)}
				</div>
				<div>
					<h2 className="text-white font-semibold text-sm leading-tight">{name}</h2>
					<p className="text-slate-500 text-xs">{city}</p>
				</div>
				<span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">
					{category}
				</span>
			</div>
			<dl className="space-y-1.5 text-xs text-slate-400">
				<div className="flex justify-between">
					<dt>Entraîneur</dt>
					<dd className="text-white">{coach}</dd>
				</div>
				<div className="flex justify-between">
					<dt>Joueurs</dt>
					<dd className="text-white">{players}</dd>
				</div>
				<div className="flex justify-between">
					<dt>Victoires</dt>
					<dd className="text-green-400 font-medium">{wins}V · {losses}D</dd>
				</div>
			</dl>
			<div className="mt-4">
				<div className="flex justify-between text-xs text-slate-500 mb-1">
					<span>Taux de victoire</span>
					<span className="text-white">{winRate}%</span>
				</div>
				<div className="w-full bg-white/5 rounded-full h-1.5" role="progressbar" aria-valuenow={winRate} aria-valuemin={0} aria-valuemax={100} aria-label={`Taux de victoire : ${winRate}%`}>
					<div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${winRate}%` }} />
				</div>
			</div>
		</article>
	);
}

function CardSkeleton() {
	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-5 animate-pulse space-y-4">
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-white/5" />
				<div className="space-y-1.5 flex-1">
					<div className="h-3.5 bg-white/5 rounded w-2/3" />
					<div className="h-2.5 bg-white/5 rounded w-1/3" />
				</div>
			</div>
			<div className="space-y-2">
				{[1, 2, 3].map((i) => <div key={i} className="h-3 bg-white/5 rounded" />)}
			</div>
		</div>
	);
}

function EquipesPage() {
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getTeams()
			.then(({ data }) => setTeams(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
			<PageHeader
				badge="Toutes les équipes"
				title="Les équipes"
				highlight="inscrites."
				subtitle="Retrouvez toutes les équipes participantes aux tournois de la plateforme."
			/>
			<ul
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
				role="list"
				aria-busy={loading}
				aria-label="Liste des équipes"
			>
				{loading
					? [1, 2, 3, 4, 5, 6].map((i) => <li key={i}><CardSkeleton /></li>)
					: teams.map((t) => (
							<li key={t.id}>
								<TeamCard {...t} />
							</li>
					  ))}
			</ul>
		</main>
	);
}

export default EquipesPage;
