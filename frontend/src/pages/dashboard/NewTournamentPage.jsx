import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { useToast } from "../../contexts/ToastContext";
import { createTournament } from "../../services/tournamentService";
import { addDashboardTeam } from "../../services/dashboardService";
import ConfirmModal from "../../components/ui/ConfirmModal";

/* ─── Constants ────────────────────────────────────────────────── */
const SPORTS = [
	{ value: "football",   label: "Football ⚽" },
	{ value: "futsal",     label: "Futsal" },
	{ value: "basketball", label: "Basketball 🏀" },
	{ value: "handball",   label: "Handball 🤾" },
	{ value: "volleyball", label: "Volleyball 🏐" },
	{ value: "rugby",      label: "Rugby 🏉" },
	{ value: "tennis",     label: "Tennis 🎾" },
	{ value: "esport",     label: "Esport 🎮" },
];

const CATEGORIES = [
	{ value: "u13", label: "U13" }, { value: "u15", label: "U15" },
	{ value: "u17", label: "U17" }, { value: "u18", label: "U18" },
	{ value: "senior", label: "Senior" },
];

const FORMATS = [
	{ value: "groupes_elimination", label: "Phase de groupes + Élimination" },
	{ value: "elimination",         label: "Élimination directe" },
	{ value: "poule",               label: "Poule unique" },
	{ value: "championnat",         label: "Championnat" },
];

const TEAM_CATS = ["U13","U15","U16","U17","U18","Senior"];

const T_INITIAL = {
	name:"", sport:"", category:"", format:"",
	contact:"", location:"", startDate:"", endDate:"", maxTeams:"", description:"",
};

const inputCls = "w-full bg-[#0D1117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";

/* ─── Shared helpers ───────────────────────────────────────────── */
function Field({ label, required, error, children }) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-slate-300 text-sm font-medium">
				{label}{required && <span className="text-red-400 ml-0.5">*</span>}
			</label>
			{children}
			{error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
		</div>
	);
}

function readFileAsDataURL(file) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target.result);
		reader.readAsDataURL(file);
	});
}

/* ─── Step indicator ───────────────────────────────────────────── */
function StepBar({ step }) {
	return (
		<div className="flex items-center gap-3 mb-7" aria-label="Étapes">
			{[
				{ n: 1, label: "Tournoi" },
				{ n: 2, label: "Équipes" },
			].map(({ n, label }, i) => (
				<>
					{i > 0 && (
						<div className={`flex-1 h-px ${step > 1 ? "bg-green-500/50" : "bg-white/10"}`} aria-hidden="true" />
					)}
					<div key={n} className="flex items-center gap-2">
						<div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
							step === n
								? "bg-green-500 border-green-500 text-black"
								: step > n
								? "bg-green-500/20 border-green-500/40 text-green-400"
								: "bg-white/5 border-white/10 text-slate-500"
						}`}>
							{step > n ? (
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : n}
						</div>
						<span className={`text-sm font-medium hidden sm:block ${step >= n ? "text-white" : "text-slate-500"}`}>
							{label}
						</span>
					</div>
				</>
			))}
		</div>
	);
}

/* ─── Step 1 — Tournament form ─────────────────────────────────── */
function StepTournament({ onCreated }) {
	const [form, setForm]     = useState(T_INITIAL);
	const [errors, setErrors] = useState({});
	const [loading, setLoad]  = useState(false);
	const navigate            = useNavigate();

	const set = (field) => (e) => {
		setForm((p) => ({ ...p, [field]: e.target.value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name      = "Le nom est requis.";
		if (!form.sport)       next.sport      = "Choisissez un sport.";
		if (!form.category)    next.category   = "Choisissez une catégorie.";
		if (!form.startDate)   next.startDate  = "La date de début est requise.";
		if (!form.endDate)     next.endDate    = "La date de fin est requise.";
		else if (form.startDate && form.endDate < form.startDate)
			next.endDate = "La date de fin doit être après le début.";
		return next;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) { setErrors(errs); return; }
		setLoad(true);
		try {
			const { data } = await createTournament(form);
			onCreated(data);
		} finally {
			setLoad(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="space-y-5">
			<section className="bg-[#161B22] border border-white/5 rounded-xl p-5 space-y-4">
				<h2 className="text-white text-sm font-semibold">Informations générales</h2>

				<Field label="Nom du tournoi" required error={errors.name}>
					<input className={inputCls} placeholder="ex. Challenge U15 Lyon 2025" value={form.name} onChange={set("name")} />
				</Field>

				<div className="grid grid-cols-2 gap-4">
					<Field label="Sport" required error={errors.sport}>
						<select className={inputCls} value={form.sport} onChange={set("sport")}>
							<option value="" disabled>Sélectionner un sport</option>
							{SPORTS.map(({ value, label }) => (
								<option key={value} value={value} className="bg-[#161B22]">{label}</option>
							))}
						</select>
					</Field>
					<Field label="Catégorie" required error={errors.category}>
						<select className={inputCls} value={form.category} onChange={set("category")}>
							<option value="" disabled>Sélectionner une catégorie</option>
							{CATEGORIES.map(({ value, label }) => (
								<option key={value} value={value} className="bg-[#161B22]">{label}</option>
							))}
						</select>
					</Field>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<Field label="Format">
						<select className={inputCls} value={form.format} onChange={set("format")}>
							<option value="" disabled>Sélectionner un format</option>
							{FORMATS.map(({ value, label }) => (
								<option key={value} value={value} className="bg-[#161B22]">{label}</option>
							))}
						</select>
					</Field>
					<Field label="Nombre max d'équipes">
						<input className={inputCls} type="number" min="2" max="256" placeholder="ex. 16" value={form.maxTeams} onChange={set("maxTeams")} />
					</Field>
				</div>
			</section>

			<section className="bg-[#161B22] border border-white/5 rounded-xl p-5 space-y-4">
				<h2 className="text-white text-sm font-semibold">Lieu &amp; dates</h2>
				<Field label="Lieu">
					<input className={inputCls} placeholder="Ville, stade ou adresse" value={form.location} onChange={set("location")} />
				</Field>
				<div className="grid grid-cols-2 gap-4">
					<Field label="Date de début" required error={errors.startDate}>
						<input className={inputCls} type="date" value={form.startDate} onChange={set("startDate")} />
					</Field>
					<Field label="Date de fin" required error={errors.endDate}>
						<input className={inputCls} type="date" value={form.endDate} onChange={set("endDate")} />
					</Field>
				</div>
			</section>

			<section className="bg-[#161B22] border border-white/5 rounded-xl p-5 space-y-4">
				<h2 className="text-white text-sm font-semibold">Contact &amp; description</h2>
				<Field label="Email ou téléphone">
					<input className={inputCls} placeholder="contact@club.fr" value={form.contact} onChange={set("contact")} />
				</Field>
				<Field label="Description">
					<textarea className={`${inputCls} resize-none`} rows={3} placeholder="Règlement, infos pratiques…" value={form.description} onChange={set("description")} />
				</Field>
			</section>

			<div className="flex items-center justify-end gap-3 pb-2">
				<button type="button" onClick={() => navigate("/dashboard")} className="px-5 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
					Annuler
				</button>
				<button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
					{loading
						? <><span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />Création…</>
						: "Suivant : Équipes →"}
				</button>
			</div>
		</form>
	);
}

/* ─── Step 2 — Add teams ───────────────────────────────────────── */
function LogoZone({ preview, onChange }) {
	const ref = useRef(null);
	return (
		<div className="flex items-center gap-3">
			<div
				onClick={() => ref.current?.click()}
				className="w-14 h-14 rounded-xl bg-[#0D1117] border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:border-green-500/40 transition-colors"
				role="button" tabIndex={0}
				onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
				aria-label="Choisir un logo de club"
			>
				{preview
					? <img src={preview} alt="Logo" className="w-full h-full object-cover" />
					: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600" aria-hidden="true">
							<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
						</svg>
				}
			</div>
			<div>
				<button type="button" onClick={() => ref.current?.click()} className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">
					{preview ? "Changer le logo" : "Logo du club"}
				</button>
				<p className="text-slate-600 text-[10px] mt-0.5">PNG, JPG · max 2 Mo</p>
				{preview && (
					<button type="button" onClick={() => onChange(null)} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors mt-0.5">
						Supprimer
					</button>
				)}
			</div>
			<input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only"
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const dataUrl = await readFileAsDataURL(file);
					onChange(dataUrl);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

function StepTeams({ tournament, onFinish }) {
	const toast = useToast();
	const [teamForm, setTF]      = useState({ name: "", category: "", contact: "" });
	const [errors, setErrors]    = useState({});
	const [logoPreview, setLogo] = useState(null);
	const [teams, setTeams]      = useState([]);
	const [saving, setSaving]    = useState(false);
	const [pending, setPending]  = useState(null);

	const setF = (field) => (e) => {
		setTF((p) => ({ ...p, [field]: e.target.value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!teamForm.name.trim()) next.name = "Le nom est requis.";
		if (!teamForm.category)    next.category = "Choisissez une catégorie.";
		return next;
	};

	const handleAdd = async (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) { setErrors(errs); return; }
		setSaving(true);
		try {
			const payload = { ...teamForm, tournamentId: tournament.id, logo: logoPreview };
			const { data } = await addDashboardTeam(payload);
			setTeams((p) => [...p, data]);
			setTF({ name: "", category: "", contact: "" });
			setLogo(null);
		} finally {
			setSaving(false);
		}
	};

	const confirmRemove = () => {
		setTeams((p) => p.filter((t) => t.id !== pending.id));
		setPending(null);
	};

	const handleFinish = () => {
		toast.success(
			`${tournament.name} créé avec ${teams.length} équipe${teams.length > 1 ? "s" : ""}.`,
			"Tournoi prêt !"
		);
		onFinish();
	};

	const inputSm = "w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";

	return (
		<div className="space-y-5">
			{/* Context banner */}
			<div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
				<span className="text-xl" aria-hidden="true">{tournament.icon ?? "🏆"}</span>
				<div>
					<p className="text-white text-sm font-semibold">{tournament.name}</p>
					<p className="text-green-400 text-xs">Tournoi créé — ajoutez maintenant les équipes participantes.</p>
				</div>
			</div>

			{/* Add team form */}
			<section className="bg-[#161B22] border border-white/5 rounded-xl p-5">
				<h2 className="text-white text-sm font-semibold mb-4">Ajouter une équipe</h2>
				<form onSubmit={handleAdd} noValidate className="space-y-4">
					<LogoZone preview={logoPreview} onChange={setLogo} />

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-slate-400 text-xs font-medium mb-1.5">
								Nom de l'équipe <span className="text-red-400">*</span>
							</label>
							<input className={inputSm} placeholder="ex. FC Lyon U15" value={teamForm.name} onChange={setF("name")} />
							{errors.name && <p role="alert" className="text-red-400 text-xs mt-1">{errors.name}</p>}
						</div>
						<div>
							<label className="block text-slate-400 text-xs font-medium mb-1.5">
								Catégorie <span className="text-red-400">*</span>
							</label>
							<select className={inputSm} value={teamForm.category} onChange={setF("category")}>
								<option value="" disabled>Catégorie</option>
								{TEAM_CATS.map((c) => <option key={c} value={c} className="bg-[#161B22]">{c}</option>)}
							</select>
							{errors.category && <p role="alert" className="text-red-400 text-xs mt-1">{errors.category}</p>}
						</div>
					</div>

					<div>
						<label className="block text-slate-400 text-xs font-medium mb-1.5">Contact</label>
						<input className={inputSm} placeholder="Email ou téléphone" value={teamForm.contact} onChange={setF("contact")} />
					</div>

					<button
						type="submit"
						disabled={saving}
						className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full justify-center"
					>
						{saving
							? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
							: <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter l'équipe</>
						}
					</button>
				</form>
			</section>

			{/* Team list */}
			{teams.length > 0 && (
				<section className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
					<div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
						<h2 className="text-white text-sm font-semibold">
							Équipes inscrites
						</h2>
						<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
							{teams.length}
						</span>
					</div>
					<ul className="divide-y divide-white/5" role="list">
						{teams.map((t) => (
							<li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
								{t.logo
									? <img src={t.logo} alt={`Logo ${t.name}`} className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0" />
									: <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-[9px] font-black flex-shrink-0">
											{t.name.slice(0, 2).toUpperCase()}
										</div>
								}
								<div className="flex-1 min-w-0">
									<p className="text-white text-sm font-medium truncate">{t.name}</p>
									{t.contact && <p className="text-slate-500 text-xs truncate">{t.contact}</p>}
								</div>
								{t.category && (
									<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">
										{t.category}
									</span>
								)}
								<button
									onClick={() => setPending(t)}
									aria-label={`Retirer ${t.name}`}
									className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
								>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
									</svg>
								</button>
							</li>
						))}
					</ul>
				</section>
			)}

			{/* Footer actions */}
			<div className="flex items-center justify-between pb-2">
				<p className="text-slate-500 text-xs">
					{teams.length === 0
						? "Vous pourrez ajouter des équipes plus tard depuis le dashboard."
						: `${teams.length} équipe${teams.length > 1 ? "s" : ""} prête${teams.length > 1 ? "s" : ""}.`
					}
				</p>
				<button
					onClick={handleFinish}
					className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
				>
					Terminer →
				</button>
			</div>

		{pending && (
			<ConfirmModal
				title="Retirer cette équipe ?"
				message={`"${pending.name}" sera retirée de la liste.`}
				confirmLabel="Retirer"
				onConfirm={confirmRemove}
				onClose={() => setPending(null)}
			/>
		)}
		</div>
	);
}

/* ─── Page shell ───────────────────────────────────────────────── */
function NewTournamentPage() {
	const ctx      = useContext(BreadcrumbContext);
	const navigate = useNavigate();

	const [step, setStep]             = useState(1);
	const [tournament, setTournament] = useState(null);

	useEffect(() => {
		ctx?.setCrumbs([
			{ label: "Tournois", to: "/dashboard/tournaments" },
			{ label: step === 1 ? "Nouveau tournoi" : `${tournament?.name ?? "Équipes"}` },
		]);
	}, [step, tournament]);

	const handleCreated = (t) => {
		setTournament(t);
		setStep(2);
	};

	return (
		<div className="max-w-3xl">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-white text-2xl font-extrabold">
						{step === 1 ? "Nouveau tournoi" : "Équipes participantes"}
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						{step === 1
							? "Remplissez les informations pour créer votre tournoi."
							: "Ajoutez les équipes qui participeront à ce tournoi."}
					</p>
				</div>
				{step === 1 && (
					<button
						onClick={() => navigate("/dashboard")}
						className="text-slate-400 hover:text-white text-sm transition-colors"
					>
						Annuler
					</button>
				)}
			</div>

			<StepBar step={step} />

			{step === 1 && <StepTournament onCreated={handleCreated} />}
			{step === 2 && <StepTeams tournament={tournament} onFinish={() => navigate("/dashboard")} />}
		</div>
	);
}

export default NewTournamentPage;
