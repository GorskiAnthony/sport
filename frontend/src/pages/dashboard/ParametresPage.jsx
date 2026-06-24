import { useState, useEffect, useContext } from "react";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";
import { currentUser } from "../../data/dashboardMockData";
import { useToast } from "../../contexts/ToastContext";

const SECTIONS = ["Profil", "Notifications", "Sécurité", "Abonnement"];

function Section({ title, children }) {
	return (
		<section className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden" aria-labelledby={`section-${title}`}>
			<div className="px-5 py-3.5 border-b border-white/5">
				<h2 id={`section-${title}`} className="text-white text-sm font-semibold">{title}</h2>
			</div>
			<div className="px-5 py-5 space-y-4">{children}</div>
		</section>
	);
}

function Field({ label, children, hint }) {
	return (
		<div>
			<label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
			{children}
			{hint && <p className="text-[11px] text-slate-600 mt-1">{hint}</p>}
		</div>
	);
}

function Input({ ...props }) {
	return (
		<input
			className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500/40 transition-colors"
			{...props}
		/>
	);
}

function Toggle({ checked, onChange, label }) {
	return (
		<div className="flex items-center justify-between py-1">
			<span className="text-sm text-slate-300">{label}</span>
			<button
				role="switch"
				aria-checked={checked}
				onClick={() => onChange(!checked)}
				className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-white/10"}`}
			>
				<span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
			</button>
		</div>
	);
}

function ParametresPage() {
	const ctx = useContext(BreadcrumbContext);
	const toast = useToast();
	const [activeSection, setActiveSection] = useState("Profil");

	const [form, setForm] = useState({
		name: currentUser.name,
		email: currentUser.email,
		phone: "+33 6 12 34 56 78",
		organization: "Club Sportif de Lyon",
	});

	const [notifs, setNotifs] = useState({
		newTeam: true,
		matchResult: true,
		newsletter: false,
		reminders: true,
	});

	const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Paramètres" }]);
	}, []);

	const handleSaveProfile = (e) => {
		e.preventDefault();
		toast.success("Votre profil a été mis à jour.", "Profil sauvegardé");
	};

	const handleSavePassword = (e) => {
		e.preventDefault();
		if (passwords.next !== passwords.confirm) {
			toast.error("Les mots de passe ne correspondent pas.", "Erreur");
			return;
		}
		if (passwords.next.length < 8) {
			toast.error("Le mot de passe doit contenir au moins 8 caractères.", "Erreur");
			return;
		}
		toast.success("Votre mot de passe a été modifié.", "Mot de passe mis à jour");
		setPasswords({ current: "", next: "", confirm: "" });
	};

	return (
		<div className="max-w-3xl">
			<h1 className="text-white text-2xl font-extrabold mb-6">Paramètres</h1>

			{/* Tab bar */}
			<div className="flex gap-1 bg-[#161B22] border border-white/5 rounded-xl p-1 mb-6" role="tablist" aria-label="Sections des paramètres">
				{SECTIONS.map((s) => (
					<button
						key={s}
						role="tab"
						aria-selected={activeSection === s}
						onClick={() => setActiveSection(s)}
						className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
							activeSection === s
								? "bg-green-500/20 text-green-400"
								: "text-slate-400 hover:text-white"
						}`}
					>
						{s}
					</button>
				))}
			</div>

			{/* Profil */}
			{activeSection === "Profil" && (
				<form onSubmit={handleSaveProfile} noValidate>
					<Section title="Informations personnelles">
						{/* Avatar */}
						<div className="flex items-center gap-4 pb-2">
							<div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-xl font-bold">
								{currentUser.initials}
							</div>
							<div>
								<button type="button" className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">
									Changer la photo
								</button>
								<p className="text-[11px] text-slate-600 mt-0.5">JPG, PNG ou GIF · max 2 Mo</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Field label="Nom complet">
								<Input
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									placeholder="Jean Dupont"
								/>
							</Field>
							<Field label="Organisation">
								<Input
									value={form.organization}
									onChange={(e) => setForm({ ...form, organization: e.target.value })}
									placeholder="Club Sportif"
								/>
							</Field>
							<Field label="Adresse e-mail">
								<Input
									type="email"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									placeholder="vous@email.fr"
								/>
							</Field>
							<Field label="Téléphone" hint="Utilisé pour les alertes SMS (optionnel)">
								<Input
									type="tel"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
									placeholder="+33 6 00 00 00 00"
								/>
							</Field>
						</div>
					</Section>

					<div className="flex justify-end mt-4">
						<button
							type="submit"
							className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
						>
							Sauvegarder
						</button>
					</div>
				</form>
			)}

			{/* Notifications */}
			{activeSection === "Notifications" && (
				<Section title="Préférences de notification">
					<Toggle
						label="Nouvelle équipe inscrite"
						checked={notifs.newTeam}
						onChange={(v) => setNotifs({ ...notifs, newTeam: v })}
					/>
					<Toggle
						label="Résultat d'un match"
						checked={notifs.matchResult}
						onChange={(v) => setNotifs({ ...notifs, matchResult: v })}
					/>
					<Toggle
						label="Rappels avant les matchs"
						checked={notifs.reminders}
						onChange={(v) => setNotifs({ ...notifs, reminders: v })}
					/>
					<Toggle
						label="Newsletter et actualités"
						checked={notifs.newsletter}
						onChange={(v) => setNotifs({ ...notifs, newsletter: v })}
					/>
					<div className="flex justify-end pt-2">
						<button
							onClick={() => toast.success("Préférences de notification enregistrées.", "Sauvegardé")}
							className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
						>
							Sauvegarder
						</button>
					</div>
				</Section>
			)}

			{/* Sécurité */}
			{activeSection === "Sécurité" && (
				<form onSubmit={handleSavePassword} noValidate className="space-y-4">
					<Section title="Changer le mot de passe">
						<Field label="Mot de passe actuel">
							<Input
								type="password"
								value={passwords.current}
								onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
								placeholder="••••••••"
							/>
						</Field>
						<Field label="Nouveau mot de passe" hint="Minimum 8 caractères">
							<Input
								type="password"
								value={passwords.next}
								onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
								placeholder="••••••••"
							/>
						</Field>
						<Field label="Confirmer le nouveau mot de passe">
							<Input
								type="password"
								value={passwords.confirm}
								onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
								placeholder="••••••••"
							/>
						</Field>
					</Section>

					<Section title="Sessions actives">
						<div className="flex items-center justify-between py-1">
							<div>
								<p className="text-sm text-white">Cet appareil</p>
								<p className="text-xs text-slate-500">macOS · Chrome · Lyon, France</p>
							</div>
							<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
						</div>
					</Section>

					<div className="flex justify-end">
						<button
							type="submit"
							className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
						>
							Mettre à jour
						</button>
					</div>
				</form>
			)}

			{/* Abonnement */}
			{activeSection === "Abonnement" && (
				<Section title="Plan actuel">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-white font-semibold">Plan Gratuit</p>
							<p className="text-slate-500 text-xs mt-1">3 tournois · 8 équipes max · QR codes illimités</p>
						</div>
						<span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-white/5">
							Gratuit
						</span>
					</div>

					<div className="mt-2 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
						{[
							{ name: "Pro", price: "9€/mois", desc: "Tournois illimités · 50 équipes · Stats avancées", color: "border-green-500/40 bg-green-500/5" },
							{ name: "Club", price: "29€/mois", desc: "Tout Pro + API · Branding personnalisé · Support prioritaire", color: "border-purple-500/40 bg-purple-500/5" },
						].map((plan) => (
							<div key={plan.name} className={`border ${plan.color} rounded-xl p-4`}>
								<p className="text-white font-semibold text-sm">{plan.name}</p>
								<p className="text-green-400 font-bold mt-1">{plan.price}</p>
								<p className="text-slate-500 text-xs mt-2">{plan.desc}</p>
								<button className="mt-3 w-full text-xs font-semibold py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
									Passer à {plan.name}
								</button>
							</div>
						))}
					</div>
				</Section>
			)}
		</div>
	);
}

export default ParametresPage;
