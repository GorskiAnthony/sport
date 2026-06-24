import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const SECTIONS = ["Profil", "Notifications", "Confidentialité"];

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
			className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors"
			{...props}
		/>
	);
}

function Toggle({ checked, onChange, label, description }) {
	return (
		<div className="flex items-center justify-between py-1">
			<div>
				<p className="text-sm text-slate-300">{label}</p>
				{description && <p className="text-[11px] text-slate-600 mt-0.5">{description}</p>}
			</div>
			<button
				role="switch"
				aria-checked={checked}
				onClick={() => onChange(!checked)}
				className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? "bg-blue-500" : "bg-white/10"}`}
			>
				<span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
			</button>
		</div>
	);
}

function ParametresPage() {
	const { user } = useAuth();
	const toast = useToast();
	const [activeSection, setActiveSection] = useState("Profil");

	const [form, setForm] = useState({
		name: user?.name ?? "",
		email: user?.email ?? "",
		region: "Auvergne-Rhône-Alpes",
		favoriteSport: "Football",
	});

	const [notifs, setNotifs] = useState({
		liveScores: true,
		matchStart: true,
		tournamentNews: false,
		favoriteTeam: true,
	});

	const [privacy, setPrivacy] = useState({
		publicProfile: false,
		shareActivity: false,
		analytics: true,
	});

	useEffect(() => {
		document.title = "Paramètres — Tournoi Center";
	}, []);

	const handleSaveProfile = (e) => {
		e.preventDefault();
		toast.success("Votre profil a été mis à jour.", "Profil sauvegardé");
	};

	return (
		<div className="max-w-3xl mx-auto px-6 py-10">
			<h1 className="text-white text-2xl font-extrabold mb-2">Paramètres</h1>
			<p className="text-slate-400 text-sm mb-8">Gérez votre profil et vos préférences.</p>

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
								? "bg-blue-500/20 text-blue-400"
								: "text-slate-400 hover:text-white"
						}`}
					>
						{s}
					</button>
				))}
			</div>

			{/* Profil */}
			{activeSection === "Profil" && (
				<form onSubmit={handleSaveProfile} noValidate className="space-y-4">
					<Section title="Mon compte">
						{/* Avatar */}
						<div className="flex items-center gap-4 pb-2">
							<div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg font-bold">
								{user?.initials ?? "?"}
							</div>
							<div>
								<p className="text-white text-sm font-semibold">{user?.name ?? "Spectateur"}</p>
								<button type="button" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors mt-0.5">
									Changer la photo
								</button>
							</div>
						</div>

						<Field label="Nom affiché">
							<Input
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="Votre nom"
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
					</Section>

					<Section title="Préférences sportives">
						<Field label="Région favorite">
							<select
								value={form.region}
								onChange={(e) => setForm({ ...form, region: e.target.value })}
								className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-colors"
							>
								{["Auvergne-Rhône-Alpes", "Bretagne", "Île-de-France", "PACA", "Occitanie", "Toutes"].map((r) => (
									<option key={r} value={r} className="bg-[#161B22]">{r}</option>
								))}
							</select>
						</Field>
						<Field label="Sport préféré">
							<select
								value={form.favoriteSport}
								onChange={(e) => setForm({ ...form, favoriteSport: e.target.value })}
								className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-colors"
							>
								{["Football", "Basketball", "Tennis", "Volleyball", "Rugby", "Handball", "Esport"].map((s) => (
									<option key={s} value={s} className="bg-[#161B22]">{s}</option>
								))}
							</select>
						</Field>
					</Section>

					<div className="flex justify-end">
						<button
							type="submit"
							className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
						>
							Sauvegarder
						</button>
					</div>
				</form>
			)}

			{/* Notifications */}
			{activeSection === "Notifications" && (
				<div className="space-y-4">
					<Section title="Alertes en direct">
						<Toggle
							label="Scores en temps réel"
							description="Notification à chaque but / point marqué"
							checked={notifs.liveScores}
							onChange={(v) => setNotifs({ ...notifs, liveScores: v })}
						/>
						<Toggle
							label="Début de match"
							description="Rappel 15 min avant le coup d'envoi"
							checked={notifs.matchStart}
							onChange={(v) => setNotifs({ ...notifs, matchStart: v })}
						/>
						<Toggle
							label="Mon équipe favorite"
							description="Toutes les actualités de l'équipe suivie"
							checked={notifs.favoriteTeam}
							onChange={(v) => setNotifs({ ...notifs, favoriteTeam: v })}
						/>
						<Toggle
							label="Actualités des tournois"
							description="Nouvelles inscriptions et résultats"
							checked={notifs.tournamentNews}
							onChange={(v) => setNotifs({ ...notifs, tournamentNews: v })}
						/>
					</Section>

					<div className="flex justify-end">
						<button
							onClick={() => toast.success("Préférences de notification enregistrées.", "Sauvegardé")}
							className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
						>
							Sauvegarder
						</button>
					</div>
				</div>
			)}

			{/* Confidentialité */}
			{activeSection === "Confidentialité" && (
				<div className="space-y-4">
					<Section title="Visibilité">
						<Toggle
							label="Profil public"
							description="Les autres spectateurs peuvent voir votre profil"
							checked={privacy.publicProfile}
							onChange={(v) => setPrivacy({ ...privacy, publicProfile: v })}
						/>
						<Toggle
							label="Partager mon activité"
							description="Vos tournois suivis sont visibles par vos amis"
							checked={privacy.shareActivity}
							onChange={(v) => setPrivacy({ ...privacy, shareActivity: v })}
						/>
					</Section>

					<Section title="Données">
						<Toggle
							label="Analytics d'utilisation"
							description="Aidez-nous à améliorer l'application"
							checked={privacy.analytics}
							onChange={(v) => setPrivacy({ ...privacy, analytics: v })}
						/>

						<div className="pt-3 border-t border-white/5 space-y-2">
							<button className="text-xs text-slate-400 hover:text-white transition-colors">
								Télécharger mes données
							</button>
							<br />
							<button className="text-xs text-red-500 hover:text-red-400 transition-colors">
								Supprimer mon compte
							</button>
						</div>
					</Section>

					<div className="flex justify-end">
						<button
							onClick={() => toast.success("Paramètres de confidentialité enregistrés.", "Sauvegardé")}
							className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
						>
							Sauvegarder
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default ParametresPage;
