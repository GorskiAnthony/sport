import { useState, useEffect } from "react";
import Button from "./Button";
import heroBg from "../assets/hero.png";
import { getUpcomingTournaments } from "../services/tournamentService";

function TournamentCard({ icon, name, dates, location }) {
	return (
		<article className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer group">
			<span
				className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#161B22] rounded-lg text-lg"
				aria-hidden="true"
			>
				{icon}
			</span>
			<div className="min-w-0">
				<p className="text-white text-sm font-semibold leading-tight group-hover:text-green-400 transition-colors">
					{name}
				</p>
				<p className="text-slate-400 text-xs mt-0.5">{dates}</p>
				<p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
					<span aria-hidden="true">📍</span>
					{location}
				</p>
			</div>
		</article>
	);
}

function UpcomingTournamentsCard({ tournaments, loading }) {
	return (
		<aside
			className="bg-[#161B22]/90 backdrop-blur border border-white/10 rounded-xl p-4 w-72 flex-shrink-0"
			aria-label="Prochains tournois"
			aria-busy={loading}
		>
			<div className="flex items-center gap-2 mb-4">
				<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
				<h2 className="text-white text-sm font-semibold">Prochains tournois</h2>
			</div>

			{loading ? (
				<ul className="space-y-1" role="list" aria-label="Chargement des tournois">
					{[1, 2, 3].map((i) => (
						<li key={i} className="flex items-start gap-3 p-3">
							<div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse flex-shrink-0" />
							<div className="flex-1 space-y-2">
								<div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
								<div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
							</div>
						</li>
					))}
				</ul>
			) : (
				<ul className="space-y-1" role="list">
					{tournaments.map((t) => (
						<li key={t.id}>
							<TournamentCard {...t} />
						</li>
					))}
				</ul>
			)}

			<a
				href="#tournois"
				className="block mt-4 text-green-400 text-sm font-medium hover:text-green-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
			>
				Voir tous les tournois →
			</a>
		</aside>
	);
}

function HeroSection() {
	const [tournaments, setTournaments] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getUpcomingTournaments(3)
			.then(({ data }) => setTournaments(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<section
			className="relative min-h-[520px] flex items-center"
			aria-label="Bienvenue sur Tournoi Center"
		>
			<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
				<img src={heroBg} alt="" className="w-full h-full object-cover object-center" />
				<div className="absolute inset-0 bg-[#0D1117]/70" />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16 flex items-center justify-between gap-12">
				<div className="max-w-xl">
					<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-4">
						La plateforme pour tous les tournois
					</p>
					<h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
						Organisez.<br />
						Participez.<br />
						<span className="text-green-400">Vivez la compétition.</span>
					</h1>
					<p className="mt-5 text-slate-300 text-base leading-relaxed max-w-sm">
						La plateforme simple et complète pour gérer vos tournois de football, de la catégorie U15 et bien plus.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-4">
						<Button text="Découvrir les tournois" variant="primary" href="#tournois" arrow />
						<Button text="Organiser un tournoi" variant="ghost" href="#organiser" />
					</div>
				</div>

				<div className="hidden lg:block">
					<UpcomingTournamentsCard tournaments={tournaments} loading={loading} />
				</div>
			</div>
		</section>
	);
}

export default HeroSection;
