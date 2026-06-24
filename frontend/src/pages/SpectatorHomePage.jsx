import { useState } from "react";
import { Link } from "react-router-dom";
import {
	featuredTournaments,
	sportCategories,
	liveTournaments,
	popularStandings,
	upcomingEvents,
	latestNews,
	spectatorStats,
} from "../data/spectatorMockData";

/* ── Shared micro-components ──────────────────────────────────── */

function StatusBadge({ status }) {
	return status === "En cours" ? (
		<span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-green-500/30 text-green-400 border border-green-500/40 uppercase tracking-wider">
			<span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
			En cours
		</span>
	) : (
		<span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-500/30 text-orange-400 border border-orange-500/40 uppercase tracking-wider">
			À venir
		</span>
	);
}

function SectionHeader({ title, href, label }) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h2 className="text-white text-sm font-bold">{title}</h2>
			{href && (
				<Link
					to={href}
					aria-label={label}
					className="text-green-400 text-xs hover:text-green-300 transition-colors inline-flex items-center gap-0.5"
				>
					Voir tous
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</Link>
			)}
		</div>
	);
}

function TeamAvatar({ initials, color, textColor = "text-white", size = "w-7 h-7", fontSize = "text-[9px]" }) {
	return (
		<span className={`${size} ${color} ${textColor} rounded-full flex items-center justify-center ${fontSize} font-black flex-shrink-0`}>
			{initials}
		</span>
	);
}

/* ── Hero ──────────────────────────────────────────────────────── */

function HeroCarousel({ tournaments }) {
	const [active, setActive] = useState(0);
	const next = () => setActive((p) => (p + 1) % tournaments.length);

	const GRAD = {
		"from-green-900/80":  "from-green-900/80",
		"from-orange-900/80": "from-orange-900/80",
		"from-purple-900/80": "from-purple-900/80",
	};

	return (
		<div className="flex-1 min-w-0">
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-white text-sm font-bold">Tournois à la une</h2>
				<button
					onClick={next}
					aria-label="Tournoi suivant"
					className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white"
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
			</div>
			<div className="grid grid-cols-3 gap-3">
				{tournaments.map((t, i) => {
					const offset = (i - active + tournaments.length) % tournaments.length;
					return (
						<div
							key={t.id}
							className={`relative rounded-xl overflow-hidden border border-white/10 hover:border-green-500/40 transition-all duration-300 cursor-pointer group ${offset === 0 ? "ring-1 ring-green-500/30" : ""}`}
						>
							{/* Image */}
							<div className={`h-32 bg-gradient-to-br ${GRAD[t.color] ?? "from-slate-800"} to-[#0D1117]`}>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
								<div className="absolute top-2 left-2">
									<StatusBadge status={t.status} />
								</div>
								{/* Arrow */}
								<div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
									<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
										<path d="M5 12h14M12 5l7 7-7 7" />
									</svg>
								</div>
							</div>
							{/* Info */}
							<div className="p-3 bg-[#161B22]">
								<p className="text-white text-xs font-bold leading-tight truncate">{t.name}</p>
								<p className="text-slate-500 text-[10px] mt-0.5">{t.sport} · {t.scope}</p>
								<div className="mt-2 space-y-1">
									<div className="flex items-center gap-1 text-slate-400 text-[10px]">
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
										<span>{t.dates}</span>
									</div>
									<div className="flex items-center gap-1 text-slate-400 text-[10px]">
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
										<span>{t.teams} équipes</span>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function HeroSection() {
	const [query, setQuery] = useState("");

	return (
		<section
			className="relative overflow-hidden"
			aria-label="Bannière principale"
			style={{
				background: "linear-gradient(to bottom right, #0D1117 0%, #0f1f12 40%, #0D1117 100%)",
			}}
		>
			{/* Background layers */}
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage: "url('/hero.png')",
					backgroundSize: "cover",
					backgroundPosition: "center 30%",
				}}
				aria-hidden="true"
			/>
			<div className="absolute inset-0 bg-gradient-to-r from-[#0D1117]/95 via-[#0D1117]/70 to-[#0D1117]/80" aria-hidden="true" />
			<div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent" aria-hidden="true" />

			<div className="relative max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12 items-center">
				{/* Left */}
				<div className="flex-shrink-0 lg:w-[380px]">
					<p className="text-green-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
						Vivez la compétition
					</p>
					<h1 className="text-white text-4xl lg:text-5xl font-black leading-tight">
						Tous les tournois.<br />
						<span className="text-green-400">Au même endroit.</span>
					</h1>
					<p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-sm">
						Suivez, découvrez et ne manquez aucun des plus grands tournois de tous les sports.
					</p>

					{/* Search */}
					<form
						onSubmit={(e) => e.preventDefault()}
						className="mt-6 flex items-center gap-2"
						role="search"
						aria-label="Recherche de tournoi"
					>
						<div className="flex-1 relative">
							<input
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Rechercher un tournoi, une équipe, un sport…"
								className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 focus:bg-white/[0.08] transition-all"
							/>
						</div>
						<button
							type="submit"
							aria-label="Lancer la recherche"
							className="flex-shrink-0 w-10 h-10 bg-green-500 hover:bg-green-400 rounded-lg flex items-center justify-center transition-colors"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
								<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
							</svg>
						</button>
					</form>

					{/* Pill badges */}
					<div className="flex flex-wrap gap-2 mt-4" aria-label="Caractéristiques de la plateforme">
						{[
							{ icon: "🏆", text: "Tous les sports" },
							{ icon: "🌍", text: "Partout dans le monde" },
							{ icon: "🟢", text: "En direct & en temps réel" },
						].map(({ icon, text }) => (
							<span key={text} className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
								<span aria-hidden="true">{icon}</span>
								{text}
							</span>
						))}
					</div>
				</div>

				{/* Right — carousel */}
				<HeroCarousel tournaments={featuredTournaments} />
			</div>
		</section>
	);
}

/* ── Sports ────────────────────────────────────────────────────── */

function SportsSection() {
	const [active, setActive] = useState("football");

	return (
		<section className="max-w-7xl mx-auto px-6 py-10" aria-label="Parcourir par sport">
			<h2 className="text-white text-base font-bold mb-4">Parcourez par sport</h2>
			<div className="grid grid-cols-4 sm:grid-cols-8 gap-2" role="list">
				{sportCategories.map(({ id, label, icon }) => (
					<button
						key={id}
						role="listitem"
						onClick={() => setActive(id)}
						aria-pressed={active === id}
						className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500
							${active === id
								? "bg-green-500 border-green-500 text-black"
								: "bg-[#161B22] border-white/5 text-slate-400 hover:border-white/20 hover:text-white"
							}`}
					>
						<span className="text-xl" aria-hidden="true">{icon}</span>
						<span className="text-xs leading-tight text-center">{label}</span>
					</button>
				))}
			</div>
		</section>
	);
}

/* ── Live tournaments ──────────────────────────────────────────── */

function LiveTournamentRow({ match }) {
	return (
		<div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-4 px-4 transition-colors rounded-lg cursor-pointer">
			{/* Thumbnail placeholder */}
			<div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-base" aria-hidden="true">
				{match.sport === "Football" ? "⚽" : match.sport === "Tennis" ? "🎾" : match.sport === "Basketball" ? "🏀" : "🎮"}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<p className="text-white text-xs font-semibold truncate">{match.name}</p>
				<p className="text-slate-500 text-[10px] mt-0.5">{match.sport} · {match.location}</p>
			</div>

			{/* Status + phase */}
			<div className="text-right hidden sm:block flex-shrink-0">
				<StatusBadge status={match.status} />
				<p className="text-slate-500 text-[10px] mt-1">{match.phase}</p>
			</div>

			{/* Teams + Score */}
			<div className="flex items-center gap-1.5 flex-shrink-0">
				<TeamAvatar initials={match.team1.initials} color={match.team1.color} />
				<span className="text-slate-300 text-xs font-bold font-mono min-w-[40px] text-center">
					{match.hasScore ? `${match.score1} – ${match.score2}` : "–"}
				</span>
				<TeamAvatar initials={match.team2.initials} color={match.team2.color} />
			</div>
		</div>
	);
}

function LiveTournamentsPanel() {
	return (
		<div className="flex-1 min-w-0">
			<SectionHeader title="Tournois en cours" href="/tournois" label="Voir tous les tournois" />
			<div>
				{liveTournaments.map((match) => (
					<LiveTournamentRow key={match.id} match={match} />
				))}
			</div>
		</div>
	);
}

/* ── Standings ─────────────────────────────────────────────────── */

function StandingsPanel() {
	return (
		<div className="w-64 flex-shrink-0">
			<SectionHeader title="Classements populaires" href="/classements" label="Voir tous les classements" />
			<div className="space-y-2">
				{popularStandings.map((team) => (
					<div
						key={team.rank}
						className="flex items-center gap-3 py-2 hover:bg-white/[0.02] -mx-4 px-4 rounded-lg transition-colors cursor-pointer"
					>
						<span className="text-slate-500 text-xs w-4 text-center font-semibold">{team.rank}</span>
						<TeamAvatar
							initials={team.initials}
							color={team.color}
							textColor={team.textColor ?? "text-white"}
							size="w-8 h-8"
							fontSize="text-[9px]"
						/>
						<span className="flex-1 text-white text-xs font-medium truncate">{team.name}</span>
						<span className="text-slate-400 text-xs font-mono">{team.points} pts</span>
					</div>
				))}
			</div>
			<Link
				to="/classements"
				className="mt-4 w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center"
			>
				Voir tous les classements
			</Link>
		</div>
	);
}

/* ── Events + News ─────────────────────────────────────────────── */

function EventsPanel() {
	return (
		<div className="w-56 flex-shrink-0">
			{/* Upcoming */}
			<SectionHeader title="Prochains événements" href="/tournois" label="Voir tous les événements" />
			<div className="space-y-3">
				{upcomingEvents.map((ev) => (
					<div key={ev.id} className="flex items-center gap-3 hover:bg-white/[0.02] -mx-4 px-4 py-1 rounded-lg transition-colors cursor-pointer">
						<div className="flex-shrink-0 w-9 bg-green-500/10 border border-green-500/20 rounded-lg text-center py-1">
							<p className="text-green-400 text-sm font-black leading-none">{ev.day}</p>
							<p className="text-green-600 text-[8px] font-bold uppercase">{ev.month}</p>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-white text-[10px] font-semibold leading-tight truncate">{ev.name}</p>
							<p className="text-slate-500 text-[9px] mt-0.5 truncate">{ev.location}</p>
						</div>
						<span className="text-slate-400 text-[10px] font-mono flex-shrink-0">{ev.time}</span>
					</div>
				))}
			</div>

			{/* Actualités */}
			<div className="mt-5">
				<SectionHeader title="Actualités" href="/actualites" label="Voir toutes les actualités" />
				{latestNews.map((news) => (
					<div key={news.id} className="flex gap-3 hover:bg-white/[0.02] -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
						<div className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xl" aria-hidden="true">
							⚽
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-green-400 text-[9px] font-bold uppercase">{news.sport}</p>
							<p className="text-white text-[10px] font-semibold leading-tight mt-0.5 line-clamp-2">{news.title}</p>
							<p className="text-slate-500 text-[9px] mt-1">{news.time}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Three-column section ──────────────────────────────────────── */

function ContentSection() {
	return (
		<section className="max-w-7xl mx-auto px-6 pb-12" aria-label="Contenus en direct">
			<div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 flex gap-6">
				<LiveTournamentsPanel />
				<div className="w-px bg-white/5 self-stretch flex-shrink-0" aria-hidden="true" />
				<StandingsPanel />
				<div className="w-px bg-white/5 self-stretch flex-shrink-0" aria-hidden="true" />
				<EventsPanel />
			</div>
		</section>
	);
}

/* ── Stats + Newsletter ────────────────────────────────────────── */

function StatsNewsletterSection() {
	const [email, setEmail] = useState("");

	return (
		<section className="max-w-7xl mx-auto px-6 pb-16" aria-label="Statistiques et newsletter">
			<div className="bg-[#161B22] border border-white/5 rounded-2xl px-8 py-6 flex flex-col lg:flex-row items-center gap-8">
				{/* Stats */}
				<div className="flex flex-1 flex-wrap gap-x-10 gap-y-4">
					{spectatorStats.map((stat) => (
						<div key={stat.id} className="flex items-center gap-3">
							<div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-lg" aria-hidden="true">
								{stat.icon}
							</div>
							<div>
								<p className="text-white text-xl font-black">{stat.value}</p>
								<p className="text-slate-400 text-xs">{stat.label}</p>
							</div>
						</div>
					))}
				</div>

				{/* Newsletter */}
				<div className="flex-shrink-0 lg:w-80">
					<p className="text-white text-sm font-bold">Ne manquez rien !</p>
					<p className="text-slate-400 text-xs mt-1 mb-3">
						Abonnez-vous pour recevoir les dernières actualités et les résultats en direct.
					</p>
					<form
						onSubmit={(e) => e.preventDefault()}
						className="flex gap-2"
						aria-label="Formulaire d'inscription newsletter"
					>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Votre email"
							className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 transition-colors"
						/>
						<button
							type="submit"
							aria-label="S'abonner à la newsletter"
							className="w-10 h-10 bg-green-500 hover:bg-green-400 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</button>
					</form>
				</div>
			</div>
		</section>
	);
}

/* ── Page ──────────────────────────────────────────────────────── */

function SpectatorHomePage() {
	return (
		<main id="main-content" className="flex-1">
			<HeroSection />
			<SportsSection />
			<ContentSection />
			<StatsNewsletterSection />
		</main>
	);
}

export default SpectatorHomePage;
