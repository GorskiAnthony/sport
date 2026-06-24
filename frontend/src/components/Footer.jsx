import { footerLinks as FOOTER_LINKS } from "../data/mockData";

const SOCIAL_LINKS = [
	{
		id: "facebook",
		href: "#facebook",
		label: "Suivez-nous sur Facebook",
		icon: (
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
			</svg>
		),
	},
	{
		id: "twitter",
		href: "#twitter",
		label: "Suivez-nous sur X (Twitter)",
		icon: (
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M4 4l16 16M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			</svg>
		),
	},
	{
		id: "youtube",
		href: "#youtube",
		label: "Regardez nos vidéos sur YouTube",
		icon: (
			<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
				<polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="black" />
			</svg>
		),
	},
];

function FooterLinkGroup({ title, links }) {
	return (
		<nav aria-label={title}>
			<h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">
				{title}
			</h3>
			<ul className="space-y-3" role="list">
				{links.map(({ label, href }) => (
					<li key={href}>
						<a
							href={href}
							className="text-slate-400 text-sm hover:text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
						>
							{label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

function NewsletterForm() {
	return (
		<div>
			<h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">
				Restez informé
			</h3>
			<p className="text-slate-400 text-sm mb-4 leading-relaxed">
				Recevez les dernières actualités et tournois à venir.
			</p>
			<form
				onSubmit={(e) => e.preventDefault()}
				aria-label="Inscription à la newsletter"
				className="flex gap-2"
			>
				<label htmlFor="newsletter-email" className="sr-only">
					Votre adresse email
				</label>
				<input
					id="newsletter-email"
					type="email"
					name="email"
					placeholder="Votre email"
					required
					autoComplete="email"
					className="flex-1 bg-[#161B22] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
				/>
				<button
					type="submit"
					aria-label="S'inscrire à la newsletter"
					className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500 hover:bg-green-400 rounded transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black" aria-hidden="true">
						<line x1="5" y1="12" x2="19" y2="12" />
						<polyline points="12 5 19 12 12 19" />
					</svg>
				</button>
			</form>
		</div>
	);
}

function Footer() {
	return (
		<footer className="bg-[#0D1117] border-t border-white/5">
			<div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
				{/* Top row */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
					{/* Brand */}
					<div className="lg:col-span-1">
						<a
							href="/"
							aria-label="Tourneo — retour à l'accueil"
							className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded w-fit"
						>
							<span className="flex items-center justify-center w-8 h-8 bg-green-500 rounded" aria-hidden="true">
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="9" cy="9" r="7" stroke="black" strokeWidth="2" />
									<path d="M9 5v4l3 2" stroke="black" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</span>
							<span className="text-white font-bold text-base tracking-wide">TOURNA</span>
						</a>
						<p className="mt-4 text-slate-400 text-sm leading-relaxed">
							La plateforme de référence pour organiser et vivre des tournois de tous types.
						</p>
						<ul className="flex items-center gap-3 mt-5" role="list" aria-label="Réseaux sociaux">
							{SOCIAL_LINKS.map(({ id, href, label, icon }) => (
								<li key={id}>
									<a
										href={href}
										aria-label={label}
										className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
									>
										{icon}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Nav columns */}
					<div className="lg:col-span-1">
						<FooterLinkGroup title="Plateforme" links={FOOTER_LINKS.plateforme} />
					</div>
					<div className="lg:col-span-1">
						<FooterLinkGroup title="Ressources" links={FOOTER_LINKS.ressources} />
					</div>
					<div className="lg:col-span-1">
						<FooterLinkGroup title="Légal" links={FOOTER_LINKS.legal} />
					</div>
					<div className="lg:col-span-1">
						<NewsletterForm />
					</div>
				</div>

				{/* Bottom bar */}
				<div className="border-t border-white/5 pt-6">
					<p className="text-slate-500 text-xs text-center">
						© 2024 Tournéomanager. Tous droits réservés.
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
