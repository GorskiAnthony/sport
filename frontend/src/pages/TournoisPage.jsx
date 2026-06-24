import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { getAllTournaments } from "../services/tournamentService";

const STATUS_STYLES = {
	"En cours": "bg-green-500/20 text-green-400",
	"À venir": "bg-blue-500/20 text-blue-400",
	Terminé: "bg-slate-500/20 text-slate-400",
};

function TournamentCard({ icon, name, dates, location, sport, category, teams, status }) {
	return (
		<article className="bg-[#161B22] border border-white/5 rounded-xl p-5 hover:border-green-500/30 transition-colors duration-300 flex flex-col gap-3">
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-3">
					<span className="text-2xl" aria-hidden="true">{icon}</span>
					<h2 className="text-white font-semibold text-base leading-tight">{name}</h2>
				</div>
				<span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[status] ?? STATUS_STYLES["À venir"]}`}>
					{status}
				</span>
			</div>
			<dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
				<div className="flex items-center gap-1.5 text-slate-400">
					<span aria-hidden="true">📅</span>
					<dt className="sr-only">Dates</dt>
					<dd>{dates}</dd>
				</div>
				<div className="flex items-center gap-1.5 text-slate-400">
					<span aria-hidden="true">📍</span>
					<dt className="sr-only">Lieu</dt>
					<dd>{location}</dd>
				</div>
				<div className="flex items-center gap-1.5 text-slate-400">
					<span aria-hidden="true">⚽</span>
					<dt className="sr-only">Sport</dt>
					<dd>{sport} · {category}</dd>
				</div>
				<div className="flex items-center gap-1.5 text-slate-400">
					<span aria-hidden="true">👥</span>
					<dt className="sr-only">Équipes</dt>
					<dd>{teams} équipes</dd>
				</div>
			</dl>
		</article>
	);
}

function CardSkeleton() {
	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-5 animate-pulse space-y-3">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded bg-white/5" />
				<div className="h-4 bg-white/5 rounded w-2/3" />
			</div>
			<div className="grid grid-cols-2 gap-2">
				{[1, 2, 3, 4].map((i) => <div key={i} className="h-3 bg-white/5 rounded" />)}
			</div>
		</div>
	);
}

function TournoisPage() {
	const [tournaments, setTournaments] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getAllTournaments()
			.then(({ data }) => setTournaments(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
			<PageHeader
				badge="Tous les tournois"
				title="Trouvez votre"
				highlight="prochain tournoi."
				subtitle="Parcourez les tournois disponibles et inscrivez votre équipe en quelques clics."
			/>
			<ul
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
				role="list"
				aria-busy={loading}
				aria-label="Liste des tournois"
			>
				{loading
					? [1, 2, 3, 4, 5, 6].map((i) => <li key={i}><CardSkeleton /></li>)
					: tournaments.map((t) => (
							<li key={t.id}>
								<TournamentCard {...t} />
							</li>
					  ))}
			</ul>
		</main>
	);
}

export default TournoisPage;
