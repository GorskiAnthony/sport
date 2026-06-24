import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { getOrganizers } from "../services/organizerService";

function OrganizerCard({ name, tournaments, location, since, categories, verified }) {
	return (
		<article className="bg-[#161B22] border border-white/5 rounded-xl p-5 hover:border-green-500/30 transition-colors duration-300">
			<div className="flex items-start justify-between gap-2 mb-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-base flex-shrink-0" aria-hidden="true">
						{name.charAt(0)}
					</div>
					<div>
						<div className="flex items-center gap-1.5">
							<h2 className="text-white font-semibold text-sm leading-tight">{name}</h2>
							{verified && (
								<span title="Organisateur vérifié" aria-label="Organisateur vérifié" className="text-green-400">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
									</svg>
								</span>
							)}
						</div>
						<p className="text-slate-500 text-xs">{location}</p>
					</div>
				</div>
				<span className="text-green-400 font-bold text-lg" aria-label={`${tournaments} tournois`}>{tournaments}</span>
			</div>
			<dl className="space-y-1.5 text-xs text-slate-400 mb-4">
				<div className="flex justify-between">
					<dt>Membre depuis</dt>
					<dd className="text-white">{since}</dd>
				</div>
				<div className="flex justify-between">
					<dt>Tournois organisés</dt>
					<dd className="text-white">{tournaments}</dd>
				</div>
			</dl>
			<div className="flex flex-wrap gap-1.5" aria-label="Catégories">
				{categories.map((cat) => (
					<span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
						{cat}
					</span>
				))}
			</div>
		</article>
	);
}

function CardSkeleton() {
	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-5 animate-pulse space-y-4">
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-lg bg-white/5" />
				<div className="space-y-1.5 flex-1">
					<div className="h-3.5 bg-white/5 rounded w-3/4" />
					<div className="h-2.5 bg-white/5 rounded w-1/2" />
				</div>
			</div>
			<div className="space-y-2">
				{[1, 2].map((i) => <div key={i} className="h-3 bg-white/5 rounded" />)}
			</div>
		</div>
	);
}

function OrganisateursPage() {
	const [organizers, setOrganizers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getOrganizers()
			.then(({ data }) => setOrganizers(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
			<PageHeader
				badge="La communauté"
				title="Nos"
				highlight="organisateurs."
				subtitle="Des passionnés qui créent et gèrent les meilleurs tournois de la plateforme."
			/>
			<ul
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
				role="list"
				aria-busy={loading}
				aria-label="Liste des organisateurs"
			>
				{loading
					? [1, 2, 3, 4].map((i) => <li key={i}><CardSkeleton /></li>)
					: organizers.map((o) => (
							<li key={o.id}>
								<OrganizerCard {...o} />
							</li>
					  ))}
			</ul>
		</main>
	);
}

export default OrganisateursPage;
