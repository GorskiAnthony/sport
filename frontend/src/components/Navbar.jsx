import Button from "./Button";

const NAV_LINKS = [
	{ label: "Tournois", href: "#tournois" },
	{ label: "Équipes", href: "#equipes" },
	{ label: "Organisateurs", href: "#organisateurs" },
	{ label: "À propos", href: "#a-propos" },
	{ label: "Tarifs", href: "#tarifs" },
];

function Logo() {
	return (
		<a href="/" aria-label="Tourneo — retour à l'accueil" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded">
			<span className="flex items-center justify-center w-8 h-8 bg-green-500 rounded" aria-hidden="true">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="9" cy="9" r="7" stroke="black" strokeWidth="2" />
					<path d="M9 5v4l3 2" stroke="black" strokeWidth="2" strokeLinecap="round" />
				</svg>
			</span>
			<span className="text-white font-bold text-lg tracking-wide">TOURNEO</span>
		</a>
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

				{/* Desktop nav */}
				<ul className="hidden md:flex items-center gap-6" role="list">
					{NAV_LINKS.map(({ label, href }) => (
						<li key={href}>
							<a
								href={href}
								className="text-slate-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
							>
								{label}
							</a>
						</li>
					))}
				</ul>

				<div className="flex items-center gap-3">
					<Button text="Se connecter" variant="outline" href="#connexion" />
					<Button text="Créer un compte" variant="primary" href="#inscription" />
				</div>
			</nav>
		</header>
	);
}

export default Navbar;
