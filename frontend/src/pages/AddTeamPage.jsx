import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/ui/AuthCard";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import Button from "../components/Button";
import { addTeam, deleteTeam } from "../services/teamService";

const CATEGORIES = [
	{ value: "u13", label: "U13" },
	{ value: "u15", label: "U15" },
	{ value: "u17", label: "U17" },
	{ value: "u18", label: "U18" },
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

function AddTeamPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState(INITIAL);
	const [errors, setErrors] = useState({});
	const [teams, setTeams] = useState([]);
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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
		const { data } = await addTeam(form);
		setTeams((prev) => [...prev, data]);
		setForm(INITIAL);
	};

	const handleDelete = async (id) => {
		await deleteTeam(id);
		setTeams((prev) => prev.filter((t) => t.id !== id));
	};

	const handleFinish = () => navigate("/");

	return (
		<AuthCard
			title="Ajouter des équipes"
			subtitle="Invitez ou ajoutez les équipes participantes."
		>
			<form onSubmit={handleAdd} noValidate aria-label="Formulaire d'ajout d'équipe">
				<div className="space-y-4">
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

			{/* Teams list */}
			{teams.length > 0 && (
				<section aria-label="Équipes ajoutées" className="mt-6">
					<h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
						Équipes ajoutées
					</h2>
					<ul className="space-y-2" role="list">
						{teams.map((team) => (
							<li
								key={team.id}
								className="flex items-center justify-between bg-[#0D1117] border border-white/10 rounded-lg px-4 py-3"
							>
								<span className="text-white text-sm font-medium">{team.name}</span>
								<button
									type="button"
									onClick={() => handleDelete(team.id)}
									aria-label={`Supprimer l'équipe ${team.name}`}
									className="text-slate-500 hover:text-red-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 rounded"
								>
									<TrashIcon />
								</button>
							</li>
						))}
					</ul>

					<Button
						text={submitting ? "Finalisation…" : "Terminer →"}
						variant="outline"
						onClick={handleFinish}
						className="w-full mt-5 justify-center py-3"
					/>
				</section>
			)}
		</AuthCard>
	);
}

export default AddTeamPage;
