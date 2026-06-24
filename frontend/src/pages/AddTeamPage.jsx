import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/ui/AuthCard";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import Button from "../components/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import { addTeam, deleteTeam } from "../services/teamService";

const CATEGORIES = [
	{ value: "u13",    label: "U13" },
	{ value: "u15",    label: "U15" },
	{ value: "u17",    label: "U17" },
	{ value: "u18",    label: "U18" },
	{ value: "senior", label: "Senior" },
];

const INITIAL = { name: "", category: "", contact: "" };

function TrashIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6l-1 14H6L5 6" />
			<path d="M10 11v6M14 11v6" />
			<path d="M9 6V4h6v2" />
		</svg>
	);
}

function LogoUpload({ preview, onFileChange }) {
	const inputRef = useRef(null);

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-slate-300 text-sm font-medium">Logo du club</span>
			<div className="flex items-center gap-4">
				{/* Preview zone */}
				<div
					className="w-16 h-16 rounded-xl bg-[#0D1117] border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:border-green-500/40 transition-colors"
					onClick={() => inputRef.current?.click()}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
					aria-label="Choisir un logo de club"
				>
					{preview ? (
						<img src={preview} alt="Aperçu du logo" className="w-full h-full object-cover" />
					) : (
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600" aria-hidden="true">
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
					)}
				</div>

				<div className="flex-1">
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
					>
						{preview ? "Changer le logo" : "Choisir un logo"}
					</button>
					<p className="text-slate-600 text-xs mt-0.5">PNG, JPG ou SVG · max 2 Mo</p>
					{preview && (
						<button
							type="button"
							onClick={() => onFileChange(null)}
							className="text-xs text-slate-500 hover:text-red-400 mt-1 transition-colors"
						>
							Supprimer
						</button>
					)}
				</div>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/svg+xml,image/webp"
				className="sr-only"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					onFileChange(file);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

function AddTeamPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState(INITIAL);
	const [errors, setErrors] = useState({});
	const [teams, setTeams] = useState([]);
	const [logoFile, setLogoFile] = useState(null);
	const [logoPreview, setLogoPreview] = useState(null);
	const [pending, setPending] = useState(null);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleLogoChange = async (file) => {
		if (!file) {
			setLogoFile(null);
			setLogoPreview(null);
			return;
		}
		setLogoFile(file);
		const reader = new FileReader();
		reader.onload = (e) => setLogoPreview(e.target.result);
		reader.readAsDataURL(file);
	};

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name = "Le nom de l'équipe est requis.";
		if (!form.category) next.category = "Sélectionnez une catégorie.";
		return next;
	};

	const handleAdd = async (e) => {
		e.preventDefault();
		const next = validate();
		if (Object.keys(next).length) {
			setErrors(next);
			return;
		}
		const { data } = await addTeam({ ...form, logo: logoPreview ?? null });
		setTeams((prev) => [...prev, { ...data, logoPreview }]);
		setForm(INITIAL);
		setLogoFile(null);
		setLogoPreview(null);
	};

	const confirmDelete = async () => {
		await deleteTeam(pending.id);
		setTeams((prev) => prev.filter((t) => t.id !== pending.id));
		setPending(null);
	};

	const handleFinish = () => navigate("/");

	return (
		<>
		<AuthCard
			title="Ajouter des équipes"
			subtitle="Invitez ou ajoutez les équipes participantes."
		>
			<form onSubmit={handleAdd} noValidate aria-label="Formulaire d'ajout d'équipe">
				<div className="space-y-4">
					<LogoUpload preview={logoPreview} onFileChange={handleLogoChange} />

					<FormInput
						id="team-name"
						label="Nom de l'équipe"
						placeholder="Nom de l'équipe"
						value={form.name}
						onChange={handleChange("name")}
						required
						error={errors.name}
					/>
					<FormSelect
						id="team-category"
						label="Catégorie"
						value={form.category}
						onChange={handleChange("category")}
						options={CATEGORIES}
						placeholder="Sélectionner une catégorie"
						required
						error={errors.category}
					/>
					<FormInput
						id="team-contact"
						label="Contact"
						placeholder="Email ou téléphone"
						value={form.contact}
						onChange={handleChange("contact")}
					/>
				</div>

				<Button
					text="Ajouter l'équipe"
					variant="primary"
					type="submit"
					className="w-full mt-5 justify-center py-3"
				/>
			</form>

			{teams.length > 0 && (
				<section aria-label="Équipes ajoutées" className="mt-6">
					<h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
						Équipes ajoutées ({teams.length})
					</h2>
					<ul className="space-y-2" role="list">
						{teams.map((team) => (
							<li
								key={team.id}
								className="flex items-center justify-between bg-[#0D1117] border border-white/10 rounded-lg px-4 py-3 gap-3"
							>
								<div className="flex items-center gap-3 min-w-0">
									{team.logoPreview ? (
										<img
											src={team.logoPreview}
											alt={`Logo ${team.name}`}
											className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10"
										/>
									) : (
										<div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 flex-shrink-0 text-[10px] font-bold">
											{team.name.slice(0, 2).toUpperCase()}
										</div>
									)}
									<div className="min-w-0">
										<p className="text-white text-sm font-medium truncate">{team.name}</p>
										{team.category && (
											<p className="text-slate-500 text-xs">{team.category.toUpperCase()}</p>
										)}
									</div>
								</div>
								<button
									type="button"
									onClick={() => setPending(team)}
									aria-label={`Supprimer l'équipe ${team.name}`}
									className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 rounded"
								>
									<TrashIcon />
								</button>
							</li>
						))}
					</ul>

					<Button
						text="Terminer →"
						variant="outline"
						onClick={handleFinish}
						className="w-full mt-5 justify-center py-3"
					/>
				</section>
			)}
		</AuthCard>

		{pending && (
			<ConfirmModal
				title="Retirer cette équipe ?"
				message={`"${pending.name}" sera retirée de la liste.`}
				confirmLabel="Retirer"
				onConfirm={confirmDelete}
				onClose={() => setPending(null)}
			/>
		)}
		</>
	);
}

export default AddTeamPage;
