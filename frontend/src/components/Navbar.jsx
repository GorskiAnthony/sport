import { Link } from "react-router-dom";
import Button from "./Button";

const NAV_LINKS = [
	{ label: "Tournois", to: "/tournois" },
	{ label: "Équipes", to: "/equipes" },
	{ label: "Organisateurs", to: "/organisateurs" },
	{ label: "À propos", to: "/a-propos" },
	{ label: "Tarifs", to: "/tarifs" },
];

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
	return (
		<header className="sticky top-0 z-50 bg-[#0D1117]/95 backdrop-blur border-b border-white/5">
			<nav
				className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16"
				aria-label="Navigation principale"
			>
				<Logo />

				<ul className="hidden md:flex items-center gap-6" role="list">
					{NAV_LINKS.map(({ label, to }) => (
						<li key={to}>
							<Link
								to={to}
								className="text-slate-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
							>
								{label}
							</Link>
						</li>
					))}
				</ul>

				<div className="flex items-center gap-3">
					<Button text="Se connecter" variant="outline" href="/connexion" />
					<Button text="Créer un compte" variant="primary" href="/inscription" />
				</div>
			</nav>
		</header>
	);
}

export default Navbar;
