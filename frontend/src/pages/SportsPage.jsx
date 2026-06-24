import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";

const SPORTS = [
	{
		id: "football",
		label: "Football",
		icon: "⚽",
		description: "Le sport le plus pratiqué en France. Tournois jeunes et seniors dans toutes les régions.",
		tournaments: 8,
		teams: 42,
		players: 310,
		active: true,
		color: "border-green-500/40 bg-green-500/5",
		accent: "text-green-400",
		badge: "Disponible",
		badgeStyle: "bg-green-500/20 text-green-400",
	},
	{
		id: "basketball",
		label: "Basketball",
		icon: "🏀",
		description: "Tournois 3×3 et 5×5, toutes catégories.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "tennis",
		label: "Tennis",
		icon: "🎾",
		description: "Simples, doubles et tournois par équipes.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "volleyball",
		label: "Volleyball",
		icon: "🏐",
		description: "Beach-volley et volleyball en salle.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "rugby",
		label: "Rugby",
		icon: "🏉",
		description: "Rugby à XV, à VII et beach rugby.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "handball",
		label: "Handball",
		icon: "🤾",
		description: "Compétitions indoor toutes catégories.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "esport",
		label: "Esport",
		icon: "🎮",
		description: "FIFA, Rocket League, League of Legends et plus.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
	{
		id: "futsal",
		label: "Futsal",
		icon: "🥅",
		description: "Le foot en salle, format intensif et technique.",
		tournaments: 0,
		teams: 0,
		players: 0,
		active: false,
		color: "border-white/5",
		accent: "text-slate-400",
		badge: "Bientôt",
		badgeStyle: "bg-orange-500/10 text-orange-400",
	},
];

const FOOTBALL_CATEGORIES = [
	{ label: "U13", count: 1, color: "bg-pink-500/20 text-pink-400" },
	{ label: "U15", count: 3, color: "bg-green-500/20 text-green-400" },
	{ label: "U16", count: 1, color: "bg-amber-500/20 text-amber-400" },
	{ label: "U17", count: 2, color: "bg-blue-500/20 text-blue-400" },
	{ label: "U18", count: 1, color: "bg-purple-500/20 text-purple-400" },
	{ label: "Senior", count: 1, color: "bg-slate-500/20 text-slate-300" },
];

function SportCard({ sport }) {
	return (
		<article
			className={`relative bg-[#161B22] border ${sport.color} rounded-xl p-6 transition-all duration-300 ${
				sport.active ? "hover:border-green-500/50 cursor-pointer hover:shadow-lg hover:shadow-green-500/5" : "opacity-60"
			}`}
		>
			<div className="flex items-start justify-between mb-4">
				<span className="text-4xl" aria-hidden="true">{sport.icon}</span>
				<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sport.badgeStyle}`}>
					{sport.badge}
				</span>
			</div>

			<h2 className={`text-lg font-bold ${sport.active ? "text-white" : "text-slate-400"}`}>
				{sport.label}
			</h2>
			<p className="text-slate-500 text-xs mt-1 leading-relaxed">{sport.description}</p>

			{sport.active ? (
				<dl className="mt-4 grid grid-cols-3 gap-2">
					{[
						{ value: sport.tournaments, label: "Tournois" },
						{ value: sport.teams,       label: "Équipes" },
						{ value: sport.players,     label: "Joueurs" },
					].map(({ value, label }) => (
						<div key={label} className="text-center bg-white/[0.03] rounded-lg py-2">
							<dd className="text-white text-base font-black">{value}</dd>
							<dt className="text-slate-500 text-[10px] mt-0.5">{label}</dt>
						</div>
					))}
				</dl>
			) : (
				<div className="mt-4 h-[62px] flex items-center justify-center bg-white/[0.02] rounded-lg border border-dashed border-white/5">
					<p className="text-slate-600 text-xs">Ouverture prochaine</p>
				</div>
			)}

			{sport.active && (
				<Link
					to="/tournois"
					className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
				>
					Voir les tournois
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</Link>
			)}
		</article>
	);
}

function FootballSpotlight() {
	return (
		<section
			className="bg-[#161B22] border border-green-500/20 rounded-2xl p-6 mb-10"
			aria-label="Sport à la une : Football"
		>
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Left */}
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-3">
						<span className="text-5xl" aria-hidden="true">⚽</span>
						<div>
							<p className="text-green-400 text-xs font-bold uppercase tracking-widest">Sport à la une</p>
							<h2 className="text-white text-2xl font-black">Football</h2>
						</div>
					</div>
					<p className="text-slate-400 text-sm leading-relaxed max-w-lg">
						Tournoi Center a démarré avec le football — le sport le plus organisé en France au niveau local.
						Jeunes catégories U13 à U18, seniors, futsal : tout y est.
					</p>
					<div className="flex flex-wrap gap-2 mt-4">
						{FOOTBALL_CATEGORIES.map(({ label, count, color }) => (
							<span key={label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${color}`}>
								{label}
								<span className="opacity-60">·</span>
								<span>{count} tournoi{count > 1 ? "s" : ""}</span>
							</span>
						))}
					</div>
				</div>

				{/* Right — stats */}
				<div className="grid grid-cols-2 gap-3 lg:w-64 self-start">
					{[
						{ value: "8",   label: "Tournois actifs",  icon: "🏆" },
						{ value: "42",  label: "Équipes",           icon: "👥" },
						{ value: "310", label: "Joueurs inscrits",  icon: "👤" },
						{ value: "3",   label: "Régions couvertes", icon: "📍" },
					].map(({ value, label, icon }) => (
						<div key={label} className="bg-white/[0.04] rounded-xl p-3 text-center">
							<span className="text-lg" aria-hidden="true">{icon}</span>
							<p className="text-white text-xl font-black mt-1">{value}</p>
							<p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function SportsPage() {
	const [filter, setFilter] = useState("tous");

	const displayed = filter === "actifs"
		? SPORTS.filter((s) => s.active)
		: SPORTS;

	return (
		<main id="main-content" className="flex-1">
			<div className="max-w-7xl mx-auto px-6 py-12">
				<PageHeader
					badge="Disciplines"
					title="Explorez les"
					highlight="sports disponibles"
					subtitle="Tournoi Center couvre le football dès maintenant. D'autres sports arrivent bientôt — restez connectés."
				/>

				{/* Football spotlight */}
				<FootballSpotlight />

				{/* Filter */}
				<div className="flex items-center gap-2 mb-6" role="group" aria-label="Filtrer les sports">
					{[
						{ id: "tous",   label: "Tous les sports" },
						{ id: "actifs", label: "Disponibles" },
					].map(({ id, label }) => (
						<button
							key={id}
							onClick={() => setFilter(id)}
							aria-pressed={filter === id}
							className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500 ${
								filter === id
									? "bg-green-500 text-black"
									: "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
							}`}
						>
							{label}
						</button>
					))}
					<span className="ml-auto text-slate-600 text-xs">{displayed.length} sport{displayed.length > 1 ? "s" : ""}</span>
				</div>

				{/* Grid */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{displayed.map((sport) => (
						<SportCard key={sport.id} sport={sport} />
					))}
				</div>

				{/* CTA */}
				<div className="mt-12 text-center bg-[#161B22] border border-white/5 rounded-2xl py-10 px-6">
					<p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Votre sport n'est pas encore là ?</p>
					<h3 className="text-white text-xl font-bold mb-3">Proposez votre discipline</h3>
					<p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
						Vous organisez des tournois dans une discipline non listée ? Contactez-nous, on peut l'ajouter rapidement.
					</p>
					<Link
						to="/a-propos"
						className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold px-6 py-2.5 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
					>
						Nous contacter
					</Link>
				</div>
			</div>
		</main>
	);
}

export default SportsPage;
