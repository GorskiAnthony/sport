import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "./Button";

const NAV_LINKS = [
	{ label: "Accueil",     to: "/" },
	{ label: "Tournois",    to: "/tournois" },
	{ label: "Sports",      to: "/sports" },
	{ label: "Équipes",     to: "/equipes" },
	{ label: "Classements", to: "/classements" },
	{ label: "À propos",    to: "/a-propos" },
];

function SearchModal({ onClose }) {
	return (
		<div
			className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4"
			role="dialog"
			aria-modal="true"
			aria-label="Recherche"
			onClick={onClose}
		>
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
			<div
				className="relative w-full max-w-lg bg-[#161B22] border border-white/10 rounded-2xl p-4 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<form onSubmit={(e) => e.preventDefault()} role="search">
					<div className="flex items-center gap-3">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-400 flex-shrink-0" aria-hidden="true">
							<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
						</svg>
						<input
							autoFocus
							type="search"
							placeholder="Rechercher un tournoi, une équipe, un sport…"
							className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
						/>
						<button
							type="button"
							onClick={onClose}
							className="text-slate-500 hover:text-white text-xs transition-colors"
						>
							Esc
						</button>
					</div>
				</form>
				<p className="text-slate-600 text-xs mt-3 pt-3 border-t border-white/5">Commencez à taper pour rechercher…</p>
			</div>
		</div>
	);
}

function Logo() {
	return (
		<Link
			to="/"
			aria-label="Tournoi Center — retour à l'accueil"
			className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
		>
			<img src="/logo_white.png" alt="Tournoi Center" className="h-16 w-auto" />
		</Link>
	);
}

function Navbar() {
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<>
			<header className="sticky top-0 z-50 bg-[#0D1117]/95 backdrop-blur border-b border-white/5">
				<nav
					className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16"
					aria-label="Navigation principale"
				>
					<Logo />

					<ul className="hidden md:flex items-center gap-1" role="list">
						{NAV_LINKS.map(({ label, to }) => (
							<li key={to}>
								<NavLink
									to={to}
									end={to === "/"}
									className={({ isActive }) =>
										`relative px-3 py-1.5 text-sm transition-colors duration-200 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 ${
											isActive
												? "text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-green-500 after:rounded-full"
												: "text-slate-400 hover:text-white"
										}`
									}
								>
									{label}
								</NavLink>
							</li>
						))}
					</ul>

					<div className="flex items-center gap-2">
						<button
							onClick={() => setSearchOpen(true)}
							aria-label="Ouvrir la recherche"
							className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
								<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
							</svg>
						</button>
						<Button text="Se connecter" variant="outline" href="/connexion" />
						<Button text="Créer un compte" variant="primary" href="/inscription" />
					</div>
				</nav>
			</header>

			{searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
		</>
	);
}

export default Navbar;
