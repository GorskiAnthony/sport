import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/ui/AuthCard";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import Button from "../components/Button";
import { createTournament } from "../services/tournamentService";

const SPORTS = [
	{ value: "football", label: "Football" },
	{ value: "futsal", label: "Futsal" },
	{ value: "basketball", label: "Basketball" },
	{ value: "handball", label: "Handball" },
];

const CATEGORIES = [
	{ value: "u13", label: "U13" },
	{ value: "u15", label: "U15" },
	{ value: "u17", label: "U17" },
	{ value: "u18", label: "U18" },
	{ value: "senior", label: "Senior" },
];

const INITIAL = {
	name: "",
	sport: "",
	category: "",
	contact: "",
	location: "",
	startDate: "",
	endDate: "",
	description: "",
};

function CreateTournamentPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState(INITIAL);
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name = "Le nom du tournoi est requis.";
		if (!form.sport) next.sport = "Sélectionnez un sport.";
		if (!form.category) next.category = "Sélectionnez une catégorie.";
		if (!form.startDate) next.startDate = "La date de début est requise.";
		if (!form.endDate) next.endDate = "La date de fin est requise.";
		else if (form.startDate && form.endDate < form.startDate)
			next.endDate = "La date de fin doit être après le début.";
		return next;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const next = validate();
		if (Object.keys(next).length) {
			setErrors(next);
			return;
		}
		setLoading(true);
		try {
			await createTournament(form);
			navigate("/inscription/equipes");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard
			title="Créer un tournoi"
			subtitle="Remplissez les informations pour créer votre tournoi."
		>
			<form onSubmit={handleSubmit} noValidate aria-label="Formulaire de création de tournoi">
				<div className="space-y-4">
					<FormInput
						id="tournament-name"
						label="Nom du tournoi"
						placeholder="Nom du tournoi"
						value={form.name}
						onChange={handleChange("name")}
						required
						error={errors.name}
					/>

					<div className="grid grid-cols-2 gap-3">
						<FormSelect
							id="tournament-sport"
							label="Sport"
							value={form.sport}
							onChange={handleChange("sport")}
							options={SPORTS}
							placeholder="Sélectionner un sport"
							required
							error={errors.sport}
						/>
						<FormSelect
							id="tournament-category"
							label="Catégorie"
							value={form.category}
							onChange={handleChange("category")}
							options={CATEGORIES}
							placeholder="Sélectionner une catégorie"
							required
							error={errors.category}
						/>
					</div>

					<FormInput
						id="tournament-contact"
						label="Contact"
						placeholder="Email ou téléphone"
						value={form.contact}
						onChange={handleChange("contact")}
					/>

					<FormInput
						id="tournament-location"
						label="Lieu"
						placeholder="Ville, pays ou adresse"
						value={form.location}
						onChange={handleChange("location")}
					/>

					<div className="grid grid-cols-2 gap-3">
						<FormInput
							id="tournament-start"
							label="Date de début"
							type="date"
							value={form.startDate}
							onChange={handleChange("startDate")}
							required
							error={errors.startDate}
						/>
						<FormInput
							id="tournament-end"
							label="Date de fin"
							type="date"
							value={form.endDate}
							onChange={handleChange("endDate")}
							required
							error={errors.endDate}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="tournament-description" className="text-slate-300 text-sm font-medium">
							Description
						</label>
						<textarea
							id="tournament-description"
							placeholder="Décrivez votre tournoi…"
							value={form.description}
							onChange={handleChange("description")}
							rows={4}
							className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow resize-none"
						/>
					</div>
				</div>

				<Button
					text={loading ? "Création…" : "Créer le tournoi"}
					variant="primary"
					type="submit"
					className="w-full mt-6 justify-center py-3"
				/>
			</form>
		</AuthCard>
	);
}

export default CreateTournamentPage;
