import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/ui/AuthCard";
import FormInput from "../components/ui/FormInput";
import PasswordInput from "../components/ui/PasswordInput";
import SocialAuthButtons from "../components/ui/SocialAuthButtons";
import Button from "../components/Button";
import { register } from "../services/authService";
import { useToast } from "../contexts/ToastContext";

const ROLES = [
	{ id: "organisateur", label: "Organisateur" },
	{ id: "spectateur", label: "Spectateur" },
];

function RegisterPage() {
	const navigate = useNavigate();
	const toast = useToast();
	const [role, setRole] = useState("organisateur");
	const [form, setForm] = useState({ name: "", email: "", password: "" });
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name = "Le nom est requis.";
		if (!form.email) next.email = "L'email est requis.";
		else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Email invalide.";
		if (!form.password) next.password = "Le mot de passe est requis.";
		else if (form.password.length < 8) next.password = "8 caractères minimum.";
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
			const { data } = await register({ ...form, role });
			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));
			toast.success("Votre compte a été créé avec succès.", "Bienvenue !");
			setTimeout(() => navigate(role === "organisateur" ? "/inscription/tournoi" : "/"), 800);
		} catch (err) {
			if (err.code === "EMAIL_TAKEN") {
				setErrors({ email: "Un compte existe déjà avec cet email." });
				toast.error("Un compte existe déjà avec cet email.", "Email déjà utilisé");
			} else {
				toast.error("Une erreur est survenue. Veuillez réessayer.", "Erreur");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard title="Créer un compte" subtitle="Rejoignez la communauté Tournoi Center.">
			<form onSubmit={handleSubmit} noValidate aria-label="Formulaire de création de compte">
				{/* Role selector */}
				<fieldset className="mb-4">
					<legend className="sr-only">Choisissez votre rôle</legend>
					<div className="flex gap-3" role="group">
						{ROLES.map(({ id, label }) => (
							<button
								key={id}
								type="button"
								onClick={() => setRole(id)}
								aria-pressed={role === id}
								className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500
									${role === id
										? "bg-green-500 border-green-500 text-black"
										: "bg-transparent border-white/20 text-white hover:border-white/40"
									}`}
							>
								{label}
							</button>
						))}
					</div>
				</fieldset>

				<div className="space-y-4">
					<FormInput
						id="register-name"
						label="Nom complet"
						type="text"
						placeholder="Votre nom"
						value={form.name}
						onChange={handleChange("name")}
						autoComplete="name"
						required
						error={errors.name}
					/>
					<FormInput
						id="register-email"
						label="Email"
						type="email"
						placeholder="votre@email.com"
						value={form.email}
						onChange={handleChange("email")}
						autoComplete="email"
						required
						error={errors.email}
					/>
					<PasswordInput
						id="register-password"
						label="Mot de passe"
						value={form.password}
						onChange={handleChange("password")}
						autoComplete="new-password"
						required
						error={errors.password}
					/>
				</div>

				<Button
					text={loading ? "Création…" : "Créer mon compte"}
					variant="primary"
					type="submit"
					className="w-full mt-6 justify-center py-3"
				/>

				<SocialAuthButtons action="inscrire" />

				<p className="text-slate-400 text-sm text-center mt-2">
					Déjà un compte ?{" "}
					<Link
						to="/connexion"
						className="text-green-400 hover:text-green-300 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
					>
						Se connecter
					</Link>
				</p>
			</form>
		</AuthCard>
	);
}

export default RegisterPage;
