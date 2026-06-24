import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/ui/AuthCard";
import FormInput from "../components/ui/FormInput";
import PasswordInput from "../components/ui/PasswordInput";
import SocialAuthButtons from "../components/ui/SocialAuthButtons";
import Button from "../components/Button";
import { login } from "../services/authService";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
	const navigate  = useNavigate();
	const toast     = useToast();
	const { login: authLogin } = useAuth();
	const [form, setForm] = useState({ email: "", password: "" });
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const validate = () => {
		const next = {};
		if (!form.email) next.email = "L'email est requis.";
		else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Email invalide.";
		if (!form.password) next.password = "Le mot de passe est requis.";
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
			const { data } = await login(form);
			authLogin(data.user, data.token);
			toast.success(`Bon retour, ${data.user.name} !`, "Connexion réussie");
			setTimeout(() => {
				navigate(data.user.role === "organisateur" ? "/dashboard" : "/accueil");
			}, 800);
		} catch (err) {
			if (err.code === "EMAIL_NOT_FOUND") {
				setErrors({ email: "Aucun compte trouvé avec cet email." });
				toast.error("Aucun compte trouvé avec cet email.", "Email inconnu");
			} else if (err.code === "WRONG_PASSWORD") {
				setErrors({ password: "Mot de passe incorrect." });
				toast.error("Vérifiez votre mot de passe.", "Mot de passe incorrect");
			} else {
				toast.error("Une erreur est survenue. Réessayez.", "Erreur");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard title="Connexion" subtitle="Bon retour ! Connectez-vous à votre compte.">
			<form onSubmit={handleSubmit} noValidate aria-label="Formulaire de connexion">
				<div className="space-y-4">
					<FormInput
						id="login-email"
						label="Email"
						type="email"
						placeholder="votre@email.com"
						value={form.email}
						onChange={handleChange("email")}
						autoComplete="email"
						required
						error={errors.email}
					/>
					<div>
						<PasswordInput
							id="login-password"
							label="Mot de passe"
							value={form.password}
							onChange={handleChange("password")}
							autoComplete="current-password"
							required
							error={errors.password}
						/>
						<div className="flex justify-end mt-1.5">
							<Link
								to="/mot-de-passe-oublie"
								className="text-green-400 text-xs hover:text-green-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
							>
								Mot de passe oublié ?
							</Link>
						</div>
					</div>
				</div>

				<Button
					text={loading ? "Connexion…" : "Se connecter"}
					variant="primary"
					type="submit"
					className="w-full mt-6 justify-center py-3"
				/>

				<SocialAuthButtons action="connecter" />

				<p className="text-slate-400 text-sm text-center mt-2">
					Pas encore de compte ?{" "}
					<Link to="/inscription" className="text-green-400 hover:text-green-300 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded">
						Créer un compte
					</Link>
				</p>
			</form>

			{/* Dev hint */}
			<div className="mt-5 p-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-500 space-y-1">
				<p className="font-medium text-slate-400">Comptes de test :</p>
				<p>📋 <span className="text-slate-300">jean.dupont@email.fr</span> / <span className="text-slate-300">password123</span> <span className="text-green-500">(organisateur)</span></p>
				<p>📋 <span className="text-slate-300">spectateur@email.fr</span> / <span className="text-slate-300">password123</span> <span className="text-slate-400">(spectateur)</span></p>
			</div>
		</AuthCard>
	);
}

export default LoginPage;
