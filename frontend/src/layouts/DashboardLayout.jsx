import { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import BreadcrumbContext, { BreadcrumbProvider } from "../contexts/BreadcrumbContext";
import { getCurrentUser } from "../services/dashboardService";

/* ─── Icons ────────────────────────────────────────────────────── */
const Icon = {
	Dashboard: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
			<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
		</svg>
	),
	Tournament: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
		</svg>
	),
	Teams: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	),
	Matches: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
		</svg>
	),
	Standings: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
			<line x1="6" y1="20" x2="6" y2="14" />
		</svg>
	),
	Messages: () => (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
	{ to: "/dashboard",          label: "Tableau de bord", icon: Icon.Dashboard,  end: true },
	{ to: "/dashboard/tournois", label: "Tournois",        icon: Icon.Tournament },
	{ to: "/dashboard/equipes",  label: "Équipes",         icon: Icon.Teams },
	{ to: "/dashboard/matchs",   label: "Matchs",          icon: Icon.Matches },
	{ to: "/dashboard/classements", label: "Classements",  icon: Icon.Standings },
	{ to: "/dashboard/messages", label: "Messages",        icon: Icon.Messages },
	{ to: "/dashboard/parametres", label: "Paramètres",    icon: Icon.Settings },
];

/* ─── Sidebar ──────────────────────────────────────────────────── */
function Sidebar() {
	const navigate = useNavigate();

	const linkClass = ({ isActive }) =>
		`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
			isActive
				? "bg-green-500/20 text-green-400 font-medium"
				: "text-slate-400 hover:text-white hover:bg-white/5"
		}`;

	return (
		<aside className="w-44 flex-shrink-0 bg-[#0D1117] border-r border-white/5 flex flex-col" aria-label="Navigation du tableau de bord">
			{/* Logo */}
			<div className="px-4 py-4 border-b border-white/5">
				<Link to="/" aria-label="Tournoi Center — retour au site">
					<img src="/logo_white.png" alt="Tournoi Center" className="h-8 w-auto" />
				</Link>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Menu principal">
				{NAV.map(({ to, label, icon: IconComp, end }) => (
					<div key={to}>
						<NavLink to={to} end={end} className={linkClass} aria-label={label}>
							<IconComp />
							<span>{label}</span>
						</NavLink>
						{/* "Mes tournois" sub-item under Tableau de bord */}
						{to === "/dashboard" && (
							<NavLink
								to="/dashboard"
								end
								className={({ isActive }) =>
									`flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-xs transition-colors duration-150 mt-0.5 ${
										isActive ? "text-green-400" : "text-slate-500 hover:text-slate-300"
									}`
								}
							>
								<span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
								Mes tournois
							</NavLink>
						)}
					</div>
				))}
			</nav>

			{/* Logout */}
			<div className="px-3 pb-4 border-t border-white/5 pt-4">
				<button
					onClick={() => { localStorage.removeItem("token"); navigate("/connexion"); }}
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
	const ctx = useContext(BreadcrumbContext);
	const crumbs = ctx?.crumbs ?? [];

	return (
		<header className="h-12 flex-shrink-0 bg-[#0D1117] border-b border-white/5 flex items-center justify-between px-6">
			{/* Breadcrumb */}
			<nav aria-label="Fil d'ariane">
				{crumbs.length > 0 ? (
					<ol className="flex items-center gap-1.5 text-xs text-slate-500" role="list">
						{crumbs.map((c, i) => (
							<li key={i} className="flex items-center gap-1.5">
								{i > 0 && <span aria-hidden="true">›</span>}
								{c.to ? (
									<Link to={c.to} className="hover:text-slate-300 transition-colors">{c.label}</Link>
								) : (
									<span className="text-slate-300">{c.label}</span>
								)}
							</li>
						))}
					</ol>
				) : null}
			</nav>

			{/* User avatar */}
			{user && (
				<div
					className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold"
					aria-label={`Connecté en tant que ${user.name}`}
				>
					{user.initials}
				</div>
			)}
		</header>
	);
}

/* ─── Layout ───────────────────────────────────────────────────── */
function DashboardLayoutInner() {
	const [user, setUser] = useState(null);

	useEffect(() => {
		getCurrentUser().then(({ data }) => setUser(data));
	}, []);

	return (
		<div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden">
				<TopBar user={user} />
				<main id="dashboard-content" className="flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

function DashboardLayout() {
	return (
		<BreadcrumbProvider>
			<DashboardLayoutInner />
		</BreadcrumbProvider>
	);
}

export default DashboardLayout;
