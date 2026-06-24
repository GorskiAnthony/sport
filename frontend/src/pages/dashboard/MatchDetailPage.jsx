import { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { useToast } from "../../contexts/ToastContext";
import { getMatchById, updateMatch } from "../../services/dashboardService";
import ConfirmModal from "../../components/ui/ConfirmModal";

/* ─── Constants ────────────────────────────────────────────────── */
const TABS = ["Résumé", "Compos", "Stats", "Commentaires"];

const EVENT_TYPES = [
	{ value: "But",            icon: "⚽" },
	{ value: "Carton jaune",   icon: "🟨" },
	{ value: "Carton rouge",   icon: "🟥" },
	{ value: "Remplacement",   icon: "🔄" },
	{ value: "Penalty",        icon: "⚽" },
	{ value: "Temps additionnel", icon: "⏱️" },
];

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const STAT_ROWS = [
	{ key: "possession",     label: "Possession (%)", max: 100, isPercent: true },
	{ key: "shots",          label: "Tirs (total)",   max: 30 },
	{ key: "shotsOnTarget",  label: "Tirs cadrés",    max: 20 },
	{ key: "corners",        label: "Corners",        max: 20 },
	{ key: "fouls",          label: "Fautes",         max: 30 },
	{ key: "yellowCards",    label: "Cartons jaunes", max: 10 },
	{ key: "redCards",       label: "Cartons rouges", max: 5 },
];

const STATUSES = ["À venir", "En cours", "Terminé"];
const STATUS_STYLES = {
	"En cours": "bg-green-500/20 text-green-400 border-green-500/30",
	"À venir":  "bg-amber-500/20 text-amber-400 border-amber-500/30",
	"Terminé":  "bg-slate-500/20 text-slate-400 border-white/10",
};

const inputCls = "bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";

/* ─── Score header ─────────────────────────────────────────────── */
function ScoreHeader({ match, onChange }) {
	const { team1, team2, score1, score2, status, date, time, venue, phase } = match;

	const adj = (field, delta) => {
		const next = Math.max(0, (match[field] ?? 0) + delta);
		onChange({ [field]: next });
	};

	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-6 mb-5">
			{/* Meta row */}
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-slate-500 text-xs">{phase}</span>
					<span className="text-slate-600">·</span>
					<input
						className={`${inputCls} text-xs py-1 px-2 w-28`}
						value={date}
						onChange={(e) => onChange({ date: e.target.value })}
						placeholder="Date"
					/>
					<input
						className={`${inputCls} text-xs py-1 px-2 w-20`}
						value={time}
						onChange={(e) => onChange({ time: e.target.value })}
						placeholder="Heure"
					/>
					<input
						className={`${inputCls} text-xs py-1 px-2 w-36`}
						value={venue}
						onChange={(e) => onChange({ venue: e.target.value })}
						placeholder="Lieu / stade"
					/>
				</div>

				{/* Status */}
				<select
					value={status}
					onChange={(e) => onChange({ status: e.target.value })}
					className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLES[status] ?? STATUS_STYLES["À venir"]} bg-transparent`}
				>
					{STATUSES.map((s) => (
						<option key={s} value={s} className="bg-[#161B22] text-white font-normal">{s}</option>
					))}
				</select>
			</div>

			{/* Score */}
			<div className="flex items-center justify-center gap-8">
				{/* Team 1 */}
				<div className="flex items-center gap-4 w-40 justify-end">
					<p className="text-white font-semibold text-sm text-right">{team1}</p>
				</div>

				{/* Score controls */}
				<div className="flex items-center gap-5">
					{/* Score 1 */}
					<div className="flex items-center gap-2">
						<button onClick={() => adj("score1", -1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-lg leading-none transition-colors">−</button>
						<span className="text-white text-5xl font-extrabold tabular-nums w-10 text-center">{score1 ?? 0}</span>
						<button onClick={() => adj("score1", +1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-slate-300 text-lg leading-none transition-colors">+</button>
					</div>

					<span className="text-slate-500 text-3xl">–</span>

					{/* Score 2 */}
					<div className="flex items-center gap-2">
						<button onClick={() => adj("score2", -1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-lg leading-none transition-colors">−</button>
						<span className="text-white text-5xl font-extrabold tabular-nums w-10 text-center">{score2 ?? 0}</span>
						<button onClick={() => adj("score2", +1)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-slate-300 text-lg leading-none transition-colors">+</button>
					</div>
				</div>

				{/* Team 2 */}
				<div className="flex items-center gap-4 w-40 justify-start">
					<p className="text-white font-semibold text-sm">{team2}</p>
				</div>
			</div>
		</div>
	);
}

/* ─── Tab: Résumé ──────────────────────────────────────────────── */
function ResumeTab({ match, onChange }) {
	const [form, setForm] = useState({ minute: "", type: "But", team: match.team1, player: "" });
	const [pending, setPending] = useState(null);

	const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

	const handleAdd = (e) => {
		e.preventDefault();
		if (!form.minute || !form.type) return;
		const icon = EVENT_TYPES.find((t) => t.value === form.type)?.icon ?? "•";
		const ev   = { id: Date.now(), minute: Number(form.minute), type: form.type, team: form.team, player: form.player, icon };
		const next = [...match.events, ev].sort((a, b) => a.minute - b.minute);
		onChange({ events: next });
		setForm((p) => ({ ...p, minute: "", player: "" }));
	};

	const confirmDelete = () => {
		onChange({ events: match.events.filter((e) => e.id !== pending.id) });
		setPending(null);
	};

	return (
		<>
		<div className="space-y-5">
			{/* Timeline */}
			{match.events.length === 0 ? (
				<p className="text-slate-500 text-sm py-4">Aucun événement. Ajoutez-en ci-dessous.</p>
			) : (
				<ul className="space-y-2" role="list">
					{match.events.map((ev) => (
						<li key={ev.id} className="flex items-center gap-3 group">
							<span className="w-12 h-6 flex items-center justify-center bg-green-500/20 text-green-400 text-xs font-bold rounded flex-shrink-0">
								{ev.minute}'
							</span>
							<span className="text-lg" aria-hidden="true">{ev.icon}</span>
							<span className="flex-1 text-sm text-slate-300">
								<span className="font-medium text-white">{ev.type}</span>
								{ev.player && <> · {ev.player}</>}
								<span className="text-slate-500"> ({ev.team})</span>
							</span>
							<button
								onClick={() => setPending(ev)}
								className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all rounded"
								aria-label="Supprimer cet événement"
							>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
								</svg>
							</button>
						</li>
					))}
				</ul>
			)}

			{/* Add event form */}
			<form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 pt-4 border-t border-white/5">
				<div className="flex flex-col gap-1">
					<label className="text-slate-500 text-xs">Minute</label>
					<input className={`${inputCls} w-20`} type="number" min="1" max="120" placeholder="45" value={form.minute} onChange={set("minute")} required />
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-slate-500 text-xs">Type</label>
					<select className={`${inputCls} w-40`} value={form.type} onChange={set("type")}>
						{EVENT_TYPES.map(({ value, icon }) => (
							<option key={value} value={value} className="bg-[#161B22]">{icon} {value}</option>
						))}
					</select>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-slate-500 text-xs">Équipe</label>
					<select className={`${inputCls} w-36`} value={form.team} onChange={set("team")}>
						<option value={match.team1} className="bg-[#161B22]">{match.team1}</option>
						<option value={match.team2} className="bg-[#161B22]">{match.team2}</option>
					</select>
				</div>
				<div className="flex flex-col gap-1 flex-1 min-w-32">
					<label className="text-slate-500 text-xs">Joueur (optionnel)</label>
					<input className={inputCls} placeholder="Nom du joueur" value={form.player} onChange={set("player")} />
				</div>
				<button type="submit" className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
					+ Ajouter
				</button>
			</form>
		</div>

		{pending && (
			<ConfirmModal
				title="Supprimer cet événement ?"
				message={`${pending.minute}' · ${pending.type}${pending.player ? ` · ${pending.player}` : ""}`}
				onConfirm={confirmDelete}
				onClose={() => setPending(null)}
			/>
		)}
		</>
	);
}

/* ─── Tab: Compos ──────────────────────────────────────────────── */
function LineupColumn({ teamName, lineup, lineupKey, onChange }) {
	const [form, setForm]   = useState({ number: "", name: "", position: "Milieu" });
	const [pending, setPending] = useState(null);

	const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

	const handleAdd = (e) => {
		e.preventDefault();
		if (!form.name.trim()) return;
		onChange({ [lineupKey]: [...lineup, { id: Date.now(), ...form }] });
		setForm((p) => ({ ...p, number: "", name: "" }));
	};

	const confirmDelete = () => {
		onChange({ [lineupKey]: lineup.filter((p) => p.id !== pending.id) });
		setPending(null);
	};

	return (
		<>
		<div className="flex-1 min-w-0">
			<h3 className="text-white text-sm font-semibold mb-3">{teamName}</h3>

			{lineup.length === 0 ? (
				<p className="text-slate-600 text-xs mb-3">Aucun joueur encore.</p>
			) : (
				<ul className="space-y-1.5 mb-4" role="list">
					{lineup.map((p) => (
						<li key={p.id} className="flex items-center gap-2 group">
							{p.number && (
								<span className="w-6 text-center text-slate-500 text-xs font-mono flex-shrink-0">{p.number}</span>
							)}
							<span className="flex-1 text-sm text-white truncate">{p.name}</span>
							<span className="text-[10px] text-slate-500 hidden group-hover:hidden">{p.position}</span>
							<button
								onClick={() => setPending(p)}
								className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all rounded flex-shrink-0"
								aria-label={`Supprimer ${p.name}`}
							>
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
								</svg>
							</button>
						</li>
					))}
				</ul>
			)}

			<form onSubmit={handleAdd} className="space-y-2">
				<div className="flex gap-2">
					<input className={`${inputCls} w-14 text-center`} type="number" min="1" max="99" placeholder="N°" value={form.number} onChange={set("number")} />
					<input className={`${inputCls} flex-1`} placeholder="Nom du joueur" value={form.name} onChange={set("name")} required />
				</div>
				<div className="flex gap-2">
					<select className={`${inputCls} flex-1`} value={form.position} onChange={set("position")}>
						{POSITIONS.map((pos) => (
							<option key={pos} value={pos} className="bg-[#161B22]">{pos}</option>
						))}
					</select>
					<button type="submit" className="px-3 py-2 bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-slate-300 text-xs font-medium rounded-lg transition-colors">
						+ Ajouter
					</button>
				</div>
			</form>
		</div>

		{pending && (
			<ConfirmModal
				title="Retirer ce joueur ?"
				message={`"${pending.name}" sera retiré de la composition.`}
				confirmLabel="Retirer"
				onConfirm={confirmDelete}
				onClose={() => setPending(null)}
			/>
		)}
		</>
	);
}

function ComposTab({ match, onChange }) {
	return (
		<div className="flex gap-8 flex-wrap">
			<LineupColumn teamName={match.team1} lineup={match.lineup1 ?? []} lineupKey="lineup1" onChange={onChange} />
			<div className="w-px bg-white/5 self-stretch hidden sm:block" aria-hidden="true" />
			<LineupColumn teamName={match.team2} lineup={match.lineup2 ?? []} lineupKey="lineup2" onChange={onChange} />
		</div>
	);
}

/* ─── Tab: Stats ───────────────────────────────────────────────── */
function StatBar({ label, val1, val2, max, isPercent, onChange1, onChange2 }) {
	const pct1 = isPercent ? val1 : Math.round((val1 / max) * 100);
	const pct2 = isPercent ? val2 : Math.round((val2 / max) * 100);

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-xs">
				<input
					type="number" min="0" max={isPercent ? 100 : max}
					value={val1}
					onChange={(e) => onChange1(Number(e.target.value))}
					className="w-12 text-center bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-green-500 pb-0.5"
				/>
				<span className="text-slate-500 text-[11px]">{label}</span>
				<input
					type="number" min="0" max={isPercent ? 100 : max}
					value={val2}
					onChange={(e) => onChange2(Number(e.target.value))}
					className="w-12 text-center bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-green-500 pb-0.5"
				/>
			</div>
			<div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
				<div className="bg-green-500 transition-all" style={{ width: `${pct1}%` }} />
				<div className="flex-1 bg-white/5" />
				<div className="bg-blue-500 transition-all" style={{ width: `${pct2}%` }} />
			</div>
		</div>
	);
}

function StatsTab({ match, onChange }) {
	const stats = match.stats ?? {};

	const setS = (key1, key2) => (v1, v2) => {
		const next = { ...stats };
		if (v1 !== undefined) next[key1] = v1;
		if (v2 !== undefined) next[key2] = v2;
		onChange({ stats: next });
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between text-xs font-semibold mb-2">
				<span className="text-green-400">{match.team1}</span>
				<span className="text-blue-400">{match.team2}</span>
			</div>
			{STAT_ROWS.map(({ key, label, max, isPercent }) => (
				<StatBar
					key={key}
					label={label}
					val1={stats[`${key}1`] ?? 0}
					val2={stats[`${key}2`] ?? 0}
					max={max}
					isPercent={isPercent}
					onChange1={(v) => setS(`${key}1`, `${key}2`)(v, undefined)}
					onChange2={(v) => setS(`${key}1`, `${key}2`)(undefined, v)}
				/>
			))}
		</div>
	);
}

/* ─── Tab: Commentaires ────────────────────────────────────────── */
function CommentsTab({ match, onChange }) {
	const [text, setText] = useState("");
	const [pending, setPending] = useState(null);

	const handleAdd = (e) => {
		e.preventDefault();
		if (!text.trim()) return;
		const comment = { id: Date.now(), text: text.trim(), author: "Organisateur", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
		onChange({ comments: [...(match.comments ?? []), comment] });
		setText("");
	};

	const confirmDelete = () => {
		onChange({ comments: match.comments.filter((c) => c.id !== pending.id) });
		setPending(null);
	};

	return (
		<>
		<div className="space-y-4">
			{(match.comments ?? []).length === 0 ? (
				<p className="text-slate-500 text-sm py-2">Aucun commentaire pour ce match.</p>
			) : (
				<ul className="space-y-3" role="list">
					{match.comments.map((c) => (
						<li key={c.id} className="flex gap-3 group">
							<div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
								O
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-2">
									<span className="text-white text-xs font-semibold">{c.author}</span>
									<span className="text-slate-600 text-[10px]">{c.time}</span>
								</div>
								<p className="text-slate-300 text-sm mt-0.5">{c.text}</p>
							</div>
							<button
								onClick={() => setPending(c)}
								className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all rounded flex-shrink-0 mt-0.5"
								aria-label="Supprimer ce commentaire"
							>
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
								</svg>
							</button>
						</li>
					))}
				</ul>
			)}

			<form onSubmit={handleAdd} className="flex gap-3 pt-3 border-t border-white/5">
				<input
					className={`${inputCls} flex-1`}
					placeholder="Ajouter un commentaire…"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				<button
					type="submit"
					disabled={!text.trim()}
					className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition-colors"
				>
					Envoyer
				</button>
			</form>
		</div>

		{pending && (
			<ConfirmModal
				title="Supprimer ce commentaire ?"
				message={`"${pending.text.slice(0, 60)}${pending.text.length > 60 ? "…" : ""}"`}
				onConfirm={confirmDelete}
				onClose={() => setPending(null)}
			/>
		)}
		</>
	);
}

/* ─── Page ─────────────────────────────────────────────────────── */
function MatchDetailPage() {
	const { id }   = useParams();
	const ctx      = useContext(BreadcrumbContext);
	const navigate = useNavigate();
	const toast    = useToast();

	const [match, setMatch]     = useState(null);
	const [loading, setLoading] = useState(true);
	const [dirty, setDirty]     = useState(false);
	const [saving, setSaving]   = useState(false);
	const [tab, setTab]         = useState("Résumé");

	useEffect(() => {
		getMatchById(id).then(({ data }) => {
			setMatch(data);
			if (data) {
				ctx?.setCrumbs([
					{ label: "Matchs", to: "/dashboard/matches" },
					{ label: `${data.team1} – ${data.team2}` },
				]);
			}
		}).finally(() => setLoading(false));
	}, [id]);

	const patch = useCallback((changes) => {
		setMatch((prev) => ({ ...prev, ...changes }));
		setDirty(true);
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			await updateMatch(id, match);
			setDirty(false);
			toast.success("Modifications sauvegardées.", "Sauvegardé");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="max-w-4xl animate-pulse space-y-4">
				<div className="h-48 bg-[#161B22] rounded-xl" />
				<div className="h-64 bg-[#161B22] rounded-xl" />
			</div>
		);
	}

	if (!match) {
		return (
			<div className="max-w-4xl">
				<p className="text-slate-400">Match introuvable.</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl">
			{/* Page header */}
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate("/dashboard/matches")}
						className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
						aria-label="Retour aux matchs"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<polyline points="15 18 9 12 15 6"/>
						</svg>
					</button>
					<div>
						<h1 className="text-white text-xl font-extrabold">{match.team1} – {match.team2}</h1>
						<p className="text-slate-500 text-xs">{match.phase} · {match.date}</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{dirty && (
						<span className="text-amber-400 text-xs flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
							Non sauvegardé
						</span>
					)}
					<button
						onClick={handleSave}
						disabled={saving || !dirty}
						className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
					>
						{saving
							? <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
							: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
						}
						Sauvegarder
					</button>
				</div>
			</div>

			{/* Score card */}
			<ScoreHeader match={match} onChange={patch} />

			{/* Tabs */}
			<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
				<div className="flex border-b border-white/5" role="tablist" aria-label="Sections du match">
					{TABS.map((t) => (
						<button
							key={t}
							role="tab"
							aria-selected={tab === t}
							onClick={() => setTab(t)}
							className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
								tab === t
									? "text-green-400 border-green-400"
									: "text-slate-400 border-transparent hover:text-white"
							}`}
						>
							{t}
						</button>
					))}
				</div>

				<div className="p-5" role="tabpanel">
					{tab === "Résumé"        && <ResumeTab   match={match} onChange={patch} />}
					{tab === "Compos"        && <ComposTab   match={match} onChange={patch} />}
					{tab === "Stats"         && <StatsTab    match={match} onChange={patch} />}
					{tab === "Commentaires"  && <CommentsTab match={match} onChange={patch} />}
				</div>
			</div>
		</div>
	);
}

export default MatchDetailPage;
