import { useRef, useState, useEffect, useContext } from "react";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import {
	getDashboardTeams,
	addDashboardTeam,
	updateDashboardTeam,
	deleteDashboardTeam,
} from "../../services/dashboardService";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";

const CATEGORIES = ["U13", "U15", "U16", "U17", "U18", "Senior"];

const CATEGORY_STYLES = {
	U13: "bg-pink-500/20 text-pink-400",
	U15: "bg-green-500/20 text-green-400",
	U16: "bg-amber-500/20 text-amber-400",
	U17: "bg-blue-500/20 text-blue-400",
	U18: "bg-purple-500/20 text-purple-400",
	Senior: "bg-slate-500/20 text-slate-300",
};

const inputCls =
	"w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";

/* ─── Logo upload ──────────────────────────────────────────────── */
function LogoUpload({ preview, onFileChange }) {
	const ref = useRef(null);
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-slate-400 text-xs font-medium">
				Logo du club
			</span>
			<div className="flex items-center gap-3">
				<div
					onClick={() => ref.current?.click()}
					className="w-14 h-14 rounded-xl bg-[#0D1117] border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:border-green-500/40 transition-colors"
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
					aria-label="Choisir un logo"
				>
					{preview ? (
						<img
							src={preview}
							alt="Logo"
							className="w-full h-full object-cover"
						/>
					) : (
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-slate-600"
							aria-hidden="true"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
					)}
				</div>
				<div>
					<button
						type="button"
						onClick={() => ref.current?.click()}
						className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
					>
						{preview ? "Changer le logo" : "Choisir un logo"}
					</button>
					<p className="text-slate-600 text-[10px] mt-0.5">
						PNG, JPG · max 2 Mo
					</p>
					{preview && (
						<button
							type="button"
							onClick={() => onFileChange(null)}
							className="text-[10px] text-slate-500 hover:text-red-400 transition-colors mt-0.5"
						>
							Supprimer
						</button>
					)}
				</div>
			</div>
			<input
				ref={ref}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/svg+xml"
				className="sr-only"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = (ev) => onFileChange(ev.target.result);
					reader.readAsDataURL(file);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

/* ─── Team Modal (add & edit) ──────────────────────────────────── */
function TeamModal({ team, onClose, onSave }) {
	const isEdit = !!team;

	const [form, setForm] = useState({
		name: team?.name ?? "",
		category: team?.category ?? "",
		contact: team?.contact ?? "",
	});
	const [errors, setErrors] = useState({});
	const [logo, setLogo] = useState(team?.logo ?? null);
	const [submitting, setSub] = useState(false);

	const set = (field) => (e) => {
		setForm((p) => ({ ...p, [field]: e.target.value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name = "Le nom est requis.";
		if (!form.category) next.category = "Choisissez une catégorie.";
		return next;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) {
			setErrors(errs);
			return;
		}
		setSub(true);
		try {
			await onSave({ ...form, logo: logo ?? null });
		} finally {
			setSub(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-label={isEdit ? "Modifier l'équipe" : "Ajouter une équipe"}
		>
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div className="relative w-full max-w-md bg-[#161B22] border border-white/10 rounded-2xl p-6 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div>
						<h2 className="text-white font-semibold">
							{isEdit
								? "Modifier l'équipe"
								: "Ajouter une équipe"}
						</h2>
						{isEdit && (
							<p className="text-slate-500 text-xs mt-0.5">
								Modifiez les informations et sauvegardez.
							</p>
						)}
					</div>
					<button
						onClick={onClose}
						className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
						aria-label="Fermer"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} noValidate className="space-y-4">
					<LogoUpload preview={logo} onFileChange={setLogo} />

					<div>
						<label className="block text-slate-400 text-xs font-medium mb-1.5">
							Nom de l'équipe{" "}
							<span className="text-red-400">*</span>
						</label>
						<input
							className={inputCls}
							placeholder="ex. FC Lyon U15"
							value={form.name}
							onChange={set("name")}
						/>
						{errors.name && (
							<p
								role="alert"
								className="text-red-400 text-xs mt-1"
							>
								{errors.name}
							</p>
						)}
					</div>

					<div>
						<label className="block text-slate-400 text-xs font-medium mb-1.5">
							Catégorie <span className="text-red-400">*</span>
						</label>
						<select
							className={inputCls}
							value={form.category}
							onChange={set("category")}
						>
							<option value="" disabled>
								Sélectionner une catégorie
							</option>
							{CATEGORIES.map((c) => (
								<option
									key={c}
									value={c}
									className="bg-[#161B22]"
								>
									{c}
								</option>
							))}
						</select>
						{errors.category && (
							<p
								role="alert"
								className="text-red-400 text-xs mt-1"
							>
								{errors.category}
							</p>
						)}
					</div>

					<div>
						<label className="block text-slate-400 text-xs font-medium mb-1.5">
							Contact
						</label>
						<input
							className={inputCls}
							placeholder="Email ou téléphone"
							value={form.contact}
							onChange={set("contact")}
						/>
					</div>

					<div className="flex gap-3 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black text-sm font-semibold py-2.5 rounded-lg transition-colors"
						>
							{submitting ? (
								<span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
							) : isEdit ? (
								"Sauvegarder"
							) : (
								"Ajouter"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

/* ─── Action buttons ───────────────────────────────────────────── */
function ActionButtons({ id, onEdit, onDelete }) {
	return (
		<div className="flex items-center gap-2">
			<button
				onClick={onEdit}
				aria-label="Modifier l'équipe"
				className="w-7 h-7 flex items-center justify-center bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-400"
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</button>
			<button
				onClick={() => onDelete(id)}
				aria-label="Supprimer l'équipe"
				className="w-7 h-7 flex items-center justify-center bg-slate-500/10 text-slate-400 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400"
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14H6L5 6" />
					<path d="M10 11v6M14 11v6" />
					<path d="M9 6V4h6v2" />
				</svg>
			</button>
		</div>
	);
}

/* ─── Page ─────────────────────────────────────────────────────── */
function EquipesPage() {
	const ctx = useContext(BreadcrumbContext);
	const toast = useToast();

	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalTeam, setModalTeam] = useState(undefined); // undefined=closed, null=add, team=edit
	const [pending, setPending] = useState(null);

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Équipes" }]);
		getDashboardTeams()
			.then(({ data }) => setTeams(data))
			.finally(() => setLoading(false));
	}, []);

	const handleSave = async (payload) => {
		if (modalTeam === null) {
			// ADD
			const { data } = await addDashboardTeam(payload);
			setTeams((prev) => [data, ...prev]);
			toast.success(`${payload.name} a été ajoutée.`, "Équipe ajoutée");
		} else {
			// EDIT
			await updateDashboardTeam(modalTeam.id, payload);
			setTeams((prev) =>
				prev.map((t) =>
					t.id === modalTeam.id ? { ...t, ...payload } : t,
				),
			);
			toast.success(
				`${payload.name} a été mise à jour.`,
				"Équipe modifiée",
			);
		}
		setModalTeam(undefined);
	};

	const confirmDelete = async () => {
		if (!pending) return;
		const { id, name } = pending;
		await deleteDashboardTeam(id);
		setTeams((prev) => prev.filter((t) => t.id !== id));
		toast.success(`${name} a été supprimée.`, "Équipe supprimée");
		setPending(null);
	};

	return (
		<>
			<div className="max-w-5xl">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
					<h1 className="text-white text-2xl font-extrabold">
						Équipes
					</h1>
					<button
						onClick={() => setModalTeam(null)}
						className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
					>
						+ Ajouter une équipe
					</button>
				</div>

				<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table
						className="w-full text-sm min-w-[480px]"
						aria-label="Liste des équipes"
					>
						<thead>
							<tr className="border-b border-white/5">
								<th
									scope="col"
									className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"
								>
									Équipe
								</th>
								<th
									scope="col"
									className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"
								>
									Catégorie
								</th>
								<th
									scope="col"
									className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"
								>
									Contact
								</th>
								<th
									scope="col"
									className="text-left px-5 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{loading
								? [1, 2, 3, 4].map((i) => (
										<tr
											key={i}
											className="border-b border-white/5 last:border-0 animate-pulse"
										>
											{[1, 2, 3, 4].map((j) => (
												<td
													key={j}
													className="px-5 py-4"
												>
													<div className="h-3.5 bg-white/5 rounded w-28" />
												</td>
											))}
										</tr>
									))
								: teams.filter(Boolean).map((t) => (
										<tr
											key={t.id}
											className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
										>
											<td className="px-5 py-3.5">
												<div className="flex items-center gap-3">
													{t.logo ? (
														<img
															src={t.logo}
															alt={`Logo ${t.name}`}
															className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0"
														/>
													) : (
														<div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-[9px] font-black flex-shrink-0">
															{t.name
																.slice(0, 2)
																.toUpperCase()}
														</div>
													)}
													<span className="text-white font-medium">
														{t.name}
													</span>
												</div>
											</td>
											<td className="px-5 py-3.5">
												<span
													className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_STYLES[t.category] ?? CATEGORY_STYLES.Senior}`}
												>
													{t.category}
												</span>
											</td>
											<td className="px-5 py-3.5 text-slate-400">
												{t.contact}
											</td>
											<td className="px-5 py-3.5">
												<ActionButtons
													id={t.id}
													onEdit={() =>
														setModalTeam(t)
													}
													onDelete={(id) =>
														setPending(
															teams.find(
																(x) =>
																	x.id === id,
															),
														)
													}
												/>
											</td>
										</tr>
									))}
						</tbody>
					</table>

					{!loading && teams.length === 0 && (
						<div className="py-16 text-center">
							<p className="text-slate-500 text-sm">
								Aucune équipe. Cliquez sur "+ Ajouter une
								équipe" pour commencer.
							</p>
						</div>
					)}
				</div>
				</div>
			</div>

			{modalTeam !== undefined && (
				<TeamModal
					team={modalTeam}
					onClose={() => setModalTeam(undefined)}
					onSave={handleSave}
				/>
			)}

			{pending && (
				<ConfirmModal
					title="Supprimer cette équipe ?"
					message={`"${pending.name}" sera définitivement supprimée. Cette action est irréversible.`}
					onConfirm={confirmDelete}
					onClose={() => setPending(null)}
				/>
			)}
		</>
	);
}

export default EquipesPage;
