import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { getMatchDetail } from "../../services/dashboardService";

const TABS = ["Résumé", "Compos", "Stats", "Commentaires"];

function ScoreDisplay({ team1, team2, status }) {
	return (
		<div className="text-center py-8">
			<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
				Demi-finale
			</p>
			<p className="text-white font-bold text-lg mb-4">{team1.tournament ?? "Challenge U15"}</p>
			<p className="text-slate-500 text-xs mb-6">24 Mai 2024 · 19:00 · Stade de Lyon</p>

			<div className="flex items-center justify-center gap-8">
				{/* Team 1 */}
				<div className="text-center w-28">
					<span className="text-4xl block mb-2" aria-hidden="true">{team1.emoji}</span>
					<p className="text-white text-sm font-semibold">{team1.name}</p>
				</div>

				{/* Score */}
				<div className="text-center">
					<div className="flex items-center gap-4">
						<span className="text-white text-5xl font-extrabold tabular-nums">{team1.score}</span>
						<span className="text-slate-500 text-3xl">–</span>
						<span className="text-white text-5xl font-extrabold tabular-nums">{team2.score}</span>
					</div>
					<span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400">
						{status}
					</span>
				</div>

				{/* Team 2 */}
				<div className="text-center w-28">
					<span className="text-4xl block mb-2" aria-hidden="true">{team2.emoji}</span>
					<p className="text-white text-sm font-semibold">{team2.name}</p>
				</div>
			</div>
		</div>
	);
}

function EventTimeline({ events }) {
	return (
		<div>
			<h3 className="text-white text-sm font-semibold mb-4">Résumé du match</h3>
			<ul className="space-y-3" role="list">
				{events.map((e) => (
					<li key={e.id} className="flex items-center gap-3">
						<span className="w-10 h-6 flex items-center justify-center bg-green-500/20 text-green-400 text-xs font-bold rounded flex-shrink-0">
							{e.minute}'
						</span>
						<span className="text-lg" aria-hidden="true">{e.icon}</span>
						<span className="text-slate-300 text-sm">
							{e.type} – <span className="text-white font-medium">{e.team}</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function InfoPanel({ match }) {
	const infos = [
		{ label: "Tournoi", value: match.tournament },
		{ label: "Phase",   value: match.phase },
		{ label: "Date",    value: match.date },
		{ label: "Heure",   value: match.time },
		{ label: "Lieu",    value: match.venue },
	];
	return (
		<aside className="bg-[#161B22] border border-white/5 rounded-xl p-5" aria-label="Infos du match">
			<h3 className="text-white font-semibold text-sm mb-4">Infos du match</h3>
			<dl className="space-y-3">
				{infos.map(({ label, value }) => (
					<div key={label} className="flex items-center justify-between text-sm">
						<dt className="text-slate-500">{label}</dt>
						<dd className="text-slate-300">{value}</dd>
					</div>
				))}
			</dl>
		</aside>
	);
}

function TournoisPage() {
	const ctx = useContext(BreadcrumbContext);
	const [match, setMatch] = useState(null);
	const [activeTab, setActiveTab] = useState("Résumé");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		ctx?.setCrumbs([
			{ label: "Accueil", to: "/dashboard" },
			{ label: "Tournois", to: "/dashboard/tournaments" },
			{ label: "Challenge U15" },
			{ label: "Match" },
		]);
		getMatchDetail(5)
			.then(({ data }) => setMatch(data))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="max-w-5xl animate-pulse space-y-4">
				<div className="h-48 bg-[#161B22] rounded-xl" />
				<div className="h-64 bg-[#161B22] rounded-xl" />
			</div>
		);
	}

	if (!match) return null;

	return (
		<div className="max-w-5xl">
			{/* Page header */}
			<p className="text-white text-lg font-bold mb-5">
				{match.phase} · {match.tournament}
			</p>

			{/* Score card */}
			<div className="bg-[#161B22] border border-white/5 rounded-xl mb-4">
				<ScoreDisplay team1={match.team1} team2={match.team2} status={match.status} />
			</div>

			{/* Content + Info panel */}
			<div className="flex gap-4 items-start">
				{/* Tabs */}
				<div className="flex-1 bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
					{/* Tab bar */}
					<div className="flex border-b border-white/5" role="tablist" aria-label="Sections du match">
						{TABS.map((tab) => (
							<button
								key={tab}
								role="tab"
								aria-selected={activeTab === tab}
								onClick={() => setActiveTab(tab)}
								className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
									activeTab === tab
										? "text-green-400 border-green-400"
										: "text-slate-400 border-transparent hover:text-white"
								}`}
							>
								{tab}
							</button>
						))}
					</div>

					{/* Tab content */}
					<div className="p-5" role="tabpanel">
						{activeTab === "Résumé" && <EventTimeline events={match.events} />}
						{activeTab === "Compos" && (
							<p className="text-slate-500 text-sm">Les compositions seront disponibles prochainement.</p>
						)}
						{activeTab === "Stats" && (
							<p className="text-slate-500 text-sm">Les statistiques seront disponibles prochainement.</p>
						)}
						{activeTab === "Commentaires" && (
							<p className="text-slate-500 text-sm">Aucun commentaire pour ce match.</p>
						)}
					</div>
				</div>

				{/* Info panel */}
				<div className="w-64 flex-shrink-0">
					<InfoPanel match={match} />
				</div>
			</div>
		</div>
	);
}

export default TournoisPage;
