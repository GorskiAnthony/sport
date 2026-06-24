import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";

/* ─── Icons ────────────────────────────────────────────────────── */
const Icon = {
	Home: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
		</svg>
	),
	Tournament: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
		</svg>
	),
	Sports: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<path d="M4.93 4.93l4.24 4.24" /><path d="M14.83 9.17l4.24-4.24" />
			<path d="M14.83 14.83l4.24 4.24" /><path d="M9.17 14.83l-4.24 4.24" />
			<circle cx="12" cy="12" r="4" />
		</svg>
	),
	Teams: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	),
	Standings: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
			<line x1="6" y1="20" x2="6" y2="14" />
		</svg>
	),
	Heart: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
	),
	Settings: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	),
	Logout: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
		</svg>
	),
};

const NAV = [
	{ to: "/accueil",              label: "Accueil",     icon: Icon.Home,       end: true },
	{ to: "/accueil/tournois",     label: "Tournois",    icon: Icon.Tournament },
	{ to: "/accueil/sports",       label: "Sports",      icon: Icon.Sports },
	{ to: "/accueil/equipes",      label: "Équipes",     icon: Icon.Teams },
	{ to: "/accueil/classements",  label: "Classements", icon: Icon.Standings },
	{ to: "/accueil/favoris",      label: "Favoris",     icon: Icon.Heart },
];

const NAV_BOTTOM = [
	{ to: "/accueil/parametres", label: "Paramètres", icon: Icon.Settings },
];

/* ─── Sidebar ──────────────────────────────────────────────────── */
function Sidebar({ user }) {
	const navigate = useNavigate();

	const linkClass = ({ isActive }) =>
		`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
			isActive
				? "bg-green-500/20 text-green-400 font-medium"
				: "text-slate-400 hover:text-white hover:bg-white/5"
		}`;

	return (
		<aside
			className="w-44 flex-shrink-0 bg-[#0D1117] border-r border-white/5 flex flex-col"
			aria-label="Navigation spectateur"
		>
			{/* Logo */}
			<div className="px-4 py-4 border-b border-white/5">
				<Link to="/" aria-label="Tournoi Center — retour au site public">
					<img src="/logo_white.png" alt="Tournoi Center" className="h-8 w-auto" />
				</Link>
			</div>

			{/* User card */}
			{user && (
				<div className="mx-3 mt-4 mb-1 px-3 py-2.5 bg-white/[0.04] border border-white/5 rounded-xl flex items-center gap-2.5">
					<div
						className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0"
						aria-hidden="true"
					>
						{user.initials}
					</div>
					<div className="min-w-0">
						<p className="text-white text-xs font-semibold truncate">{user.name}</p>
						<p className="text-slate-500 text-[10px]">Spectateur</p>
					</div>
				</div>
			)}

			{/* Nav */}
			<nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Menu principal">
				{NAV.map(({ to, label, icon: IconComp, end }) => (
					<NavLink key={to} to={to} end={end} className={linkClass} aria-label={label}>
						<IconComp />
						<span>{label}</span>
					</NavLink>
				))}

				<div className="pt-2 mt-2 border-t border-white/5 space-y-0.5">
					{NAV_BOTTOM.map(({ to, label, icon: IconComp }) => (
						<NavLink key={to} to={to} className={linkClass} aria-label={label}>
							<IconComp />
							<span>{label}</span>
						</NavLink>
					))}
				</div>
			</nav>

			{/* Logout */}
			<div className="px-3 pb-4 pt-2 border-t border-white/5">
				<button
					onClick={() => {
						localStorage.removeItem("token");
						localStorage.removeItem("user");
						navigate("/connexion");
					}}
					className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full"
					aria-label="Se déconnecter"
				>
					<Icon.Logout />
					Déconnexion
				</button>
			</div>
		</aside>
	);
}

/* ─── TopBar ───────────────────────────────────────────────────── */
function TopBar({ user }) {
	return (
		<header className="h-12 flex-shrink-0 bg-[#0D1117] border-b border-white/5 flex items-center justify-between px-6">
			<p className="text-slate-500 text-xs">
				Bienvenue,{" "}
				<span className="text-white font-medium">{user?.name ?? "Spectateur"}</span>
			</p>

			<div className="flex items-center gap-3">
				{/* Notification bell */}
				<button
					aria-label="Notifications"
					className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
				>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
						<path d="M13.73 21a2 2 0 0 1-3.46 0" />
					</svg>
				</button>

				{user && (
					<div
						className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold"
						aria-label={`Connecté en tant que ${user.name}`}
					>
						{user.initials}
					</div>
				)}
			</div>
		</header>
	);
}

/* ─── Layout ───────────────────────────────────────────────────── */
function SpectatorLayout() {
	const [user, setUser] = useState(null);

	useEffect(() => {
		try {
			const stored = localStorage.getItem("user");
			if (stored) setUser(JSON.parse(stored));
		} catch {
			// ignore malformed storage
		}
	}, []);

	return (
		<div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
			<Sidebar user={user} />
			<div className="flex-1 flex flex-col overflow-hidden">
				<TopBar user={user} />
				<main id="spectateur-content" className="flex-1 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export default SpectatorLayout;
