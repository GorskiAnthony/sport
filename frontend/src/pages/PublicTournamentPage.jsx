import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { upcomingTournaments } from "../data/mockData";
import { matches } from "../data/dashboardMockData";
import { useToast } from "../contexts/ToastContext";

function PublicTournamentPage() {
	const { id } = useParams();
	const toast = useToast();
	const [user, setUser] = useState(null);
	const [following, setFollowing] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem("user");
			if (stored) setUser(JSON.parse(stored));
		} catch { /* ignore */ }
	}, []);

	const tournament = upcomingTournaments.find((t) => t.id === Number(id));
	const tournamentMatches = matches.slice(0, 3);

	if (!tournament) {
		return (
			<div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-center px-6">
				<div>
					<p className="text-5xl mb-4" aria-hidden="true">🔍</p>
					<h1 className="text-white text-xl font-bold mb-2">Tournoi introuvable</h1>
					<p className="text-slate-400 text-sm mb-6">Ce QR code ne correspond à aucun tournoi actif.</p>
					<Link to="/" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold px-6 py-2.5 rounded-xl transition-colors">
						Retour à l'accueil
					</Link>
				</div>
			</div>
		);
	}

	const STATUS_STYLES = {
		"En cours": "bg-green-500/20 text-green-400 border-green-500/30",
		"À venir":  "bg-amber-500/20 text-amber-400 border-amber-500/30",
		"Terminé":  "bg-slate-500/20 text-slate-400 border-slate-500/30",
	};

	const handleFollow = () => {
		if (!user) return;
		setFollowing((prev) => {
			const next = !prev;
			toast.success(
				next ? "Tournoi ajouté à vos favoris." : "Tournoi retiré de vos favoris.",
				next ? "Suivi !" : "Retiré des favoris",
			);
			return next;
		});
	};

	return (
		<div className="min-h-screen bg-[#0D1117] text-white">
			{/* Mini header */}
			<header className="border-b border-white/5 bg-[#0D1117]/95 backdrop-blur sticky top-0 z-40">
				<div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
					<Link to="/" aria-label="Tournoi Center">
						<img src="/logo_white.png" alt="Tournoi Center" className="h-8 w-auto" />
					</Link>
					<div className="flex items-center gap-2">
						{user ? (
							<Link to="/home" className="text-green-400 text-sm hover:text-green-300 transition-colors">
								Mon espace
							</Link>
						) : (
							<>
								<Link to="/login" className="text-slate-400 text-sm hover:text-white transition-colors">Se connecter</Link>
								<Link to="/register" className="bg-green-500 hover:bg-green-400 text-black text-sm font-bold px-4 py-1.5 rounded-lg transition-colors">
									Créer un compte
								</Link>
							</>
						)}
					</div>
				</div>
			</header>

			<main className="max-w-2xl mx-auto px-4 py-8" id="main-content">
				{/* QR scan badge */}
				<div className="inline-flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-6">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
						<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
					</svg>
					Page partagée via QR code
				</div>

				{/* Tournament header */}
				<div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 mb-5">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-4">
							<span className="text-4xl" aria-hidden="true">{tournament.icon}</span>
							<div>
								<span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border ${STATUS_STYLES[tournament.status] ?? STATUS_STYLES["À venir"]}`}>
									{tournament.status === "En cours" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />}
									{tournament.status}
								</span>
								<h1 className="text-white text-xl font-black mt-1">{tournament.name}</h1>
								<p className="text-slate-400 text-sm mt-0.5">{tournament.sport} · {tournament.category}</p>
							</div>
						</div>
					</div>

					<dl className="grid grid-cols-2 gap-3 mt-5 text-sm">
						{[
							{ icon: "📅", label: "Dates",    value: tournament.dates },
							{ icon: "📍", label: "Lieu",     value: tournament.location },
							{ icon: "👥", label: "Équipes",  value: `${tournament.teams} équipes` },
							{ icon: "🏅", label: "Catégorie", value: tournament.category },
						].map(({ icon, label, value }) => (
							<div key={label} className="bg-white/[0.03] rounded-xl px-4 py-3">
								<dt className="text-slate-500 text-xs mb-1">{icon} {label}</dt>
								<dd className="text-white text-sm font-semibold">{value}</dd>
							</div>
						))}
					</dl>
				</div>

				{/* Matches */}
				<div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 mb-5">
					<h2 className="text-white font-bold text-sm mb-4">Derniers matchs</h2>
					<div className="space-y-3">
						{tournamentMatches.map((m) => {
							const isDraw = m.score1 === m.score2;
							return (
								<div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
									<div className="flex-1 text-right">
										<p className="text-white text-xs font-semibold">{m.team1}</p>
										<p className="text-slate-500 text-[10px]">{m.phase}</p>
									</div>
									<div className="mx-4 text-center">
										<p className="text-white font-black text-base font-mono">
											<span className={!isDraw && m.score1 > m.score2 ? "text-green-400" : isDraw ? "" : "text-red-400"}>{m.score1}</span>
											<span className="text-slate-600 mx-1">–</span>
											<span className={!isDraw && m.score2 > m.score1 ? "text-green-400" : isDraw ? "" : "text-red-400"}>{m.score2}</span>
										</p>
										<p className="text-slate-600 text-[9px] mt-0.5">{m.date}</p>
									</div>
									<div className="flex-1">
										<p className="text-white text-xs font-semibold">{m.team2}</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* CTA */}
				{user ? (
					<button
						onClick={handleFollow}
						className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
							following
								? "bg-white/5 border border-white/10 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
								: "bg-green-500 hover:bg-green-400 text-black"
						}`}
					>
						{following ? (
							<>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
								Suivi — retirer des favoris
							</>
						) : (
							<>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
								Suivre ce tournoi
							</>
						)}
					</button>
				) : (
					<div className="bg-[#161B22] border border-green-500/20 rounded-2xl p-6 text-center">
						<p className="text-xl mb-3" aria-hidden="true">⚡</p>
						<h2 className="text-white font-bold text-base mb-1">Suivez ce tournoi en temps réel</h2>
						<p className="text-slate-400 text-xs mb-5 max-w-xs mx-auto">
							Créez un compte gratuit pour enregistrer ce tournoi, recevoir les scores en direct et suivre la progression.
						</p>
						<div className="flex flex-col gap-2">
							<Link
								to={`/register?redirect=/tournoi/${id}`}
								className="w-full py-3 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition-colors text-center"
							>
								Créer un compte gratuit
							</Link>
							<Link
								to={`/login?redirect=/tournoi/${id}`}
								className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-colors text-center"
							>
								J'ai déjà un compte
							</Link>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default PublicTournamentPage;
