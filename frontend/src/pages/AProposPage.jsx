import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import { getPlatformStats } from "../services/statsService";

const VALUES = [
	{ icon: "🤝", title: "Accessibilité", description: "Tourneo est pensé pour tous — clubs amateurs, académies ou organisateurs indépendants." },
	{ icon: "⚡", title: "Simplicité", description: "Créer et gérer un tournoi ne devrait pas être compliqué. On s'est assuré que ça ne l'est pas." },
	{ icon: "🌍", title: "Communauté", description: "Des milliers de joueurs et d'organisateurs connectés autour de leur passion commune." },
];

const TEAM_MEMBERS = [
	{ name: "Léa Bernard", role: "Co-fondatrice & CEO", initials: "LB" },
	{ name: "Thomas Garnier", role: "CTO", initials: "TG" },
	{ name: "Sarah Morel", role: "Head of Design", initials: "SM" },
];

function AProposPage() {
	const [stats, setStats] = useState([]);

	useEffect(() => {
		getPlatformStats().then(({ data }) => setStats(data));
	}, []);

	return (
		<main id="main-content" className="flex-1">
			{/* Hero */}
			<section className="max-w-7xl mx-auto px-6 py-16">
				<PageHeader
					badge="Notre histoire"
					title="La plateforme pensée par"
					highlight="des passionnés."
					subtitle="Tourneo est né d'une frustration simple : organiser un tournoi de football ne devrait pas prendre des semaines. On a décidé de tout simplifier."
				/>
			</section>

			{/* Stats */}
			{stats.length > 0 && (
				<section className="bg-[#161B22] border-y border-white/5 py-10" aria-label="Chiffres clés">
					<dl className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
						{stats.map((s) => (
							<div key={s.id} className="text-center">
								<dd className="text-green-400 text-3xl font-extrabold">{s.value}</dd>
								<dt className="text-slate-400 text-sm mt-1">{s.label}</dt>
							</div>
						))}
					</dl>
				</section>
			)}

			{/* Values */}
			<section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="values-heading">
				<h2 id="values-heading" className="text-white text-2xl font-extrabold mb-8">
					Ce en quoi on croit
				</h2>
				<ul className="grid grid-cols-1 md:grid-cols-3 gap-5" role="list">
					{VALUES.map(({ icon, title, description }) => (
						<li key={title} className="bg-[#161B22] border border-white/5 rounded-xl p-6">
							<span className="text-2xl mb-3 block" aria-hidden="true">{icon}</span>
							<h3 className="text-white font-semibold mb-2">{title}</h3>
							<p className="text-slate-400 text-sm leading-relaxed">{description}</p>
						</li>
					))}
				</ul>
			</section>

			{/* Team */}
			<section className="max-w-7xl mx-auto px-6 pb-16" aria-labelledby="team-heading">
				<h2 id="team-heading" className="text-white text-2xl font-extrabold mb-8">
					L'équipe
				</h2>
				<ul className="flex flex-wrap gap-4" role="list">
					{TEAM_MEMBERS.map(({ name, role, initials }) => (
						<li key={name} className="flex items-center gap-4 bg-[#161B22] border border-white/5 rounded-xl px-5 py-4 min-w-56">
							<div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
								{initials}
							</div>
							<div>
								<p className="text-white font-semibold text-sm">{name}</p>
								<p className="text-slate-500 text-xs">{role}</p>
							</div>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

export default AProposPage;
