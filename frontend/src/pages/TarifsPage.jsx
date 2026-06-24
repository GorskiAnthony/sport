import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/Button";

const PLANS = [
	{
		id: "gratuit",
		name: "Gratuit",
		price: "0€",
		period: "pour toujours",
		description: "Pour découvrir la plateforme et organiser vos premiers tournois.",
		cta: "Commencer gratuitement",
		ctaVariant: "outline",
		highlighted: false,
		features: [
			"1 tournoi actif",
			"Jusqu'à 8 équipes",
			"Tableau de bord basique",
			"Support communautaire",
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: "19€",
		period: "/ mois",
		description: "Pour les organisateurs réguliers qui veulent plus de contrôle.",
		cta: "Démarrer l'essai gratuit",
		ctaVariant: "primary",
		highlighted: true,
		badge: "Populaire",
		features: [
			"Tournois illimités",
			"Équipes illimitées",
			"Résultats en temps réel",
			"Export PDF des classements",
			"Support par email",
		],
	},
	{
		id: "club",
		name: "Club",
		price: "49€",
		period: "/ mois",
		description: "Pour les clubs et associations avec plusieurs organisateurs.",
		cta: "Contacter l'équipe",
		ctaVariant: "outline",
		highlighted: false,
		features: [
			"Tout le plan Pro",
			"Plusieurs organisateurs",
			"Logo & branding personnalisé",
			"Statistiques avancées",
			"Support prioritaire",
		],
	},
];

const FAQ = [
	{ q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. La facturation est calculée au prorata." },
	{ q: "Y a-t-il un engagement ?", a: "Non, les plans Pro et Club sont sans engagement. Vous pouvez annuler à tout moment." },
	{ q: "Le plan gratuit est-il vraiment gratuit ?", a: "Oui, sans carte bancaire requise. Vous pouvez l'utiliser indéfiniment." },
];

function CheckIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true">
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

function TarifsPage() {
	return (
		<main id="main-content" className="flex-1 max-w-7xl mx-auto px-6 py-12">
			<PageHeader
				badge="Tarification simple"
				title="Un plan pour"
				highlight="chaque besoin."
				subtitle="Aucune surprise, aucun frais caché. Commencez gratuitement et évoluez quand vous en avez besoin."
			/>

			{/* Plans */}
			<ul className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20" role="list" aria-label="Plans tarifaires">
				{PLANS.map(({ id, name, price, period, description, cta, ctaVariant, highlighted, badge, features }) => (
					<li
						key={id}
						className={`relative flex flex-col rounded-2xl border p-7 transition-colors ${
							highlighted
								? "bg-[#161B22] border-green-500/50 shadow-lg shadow-green-500/10"
								: "bg-[#161B22] border-white/5 hover:border-white/10"
						}`}
					>
						{badge && (
							<span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
								{badge}
							</span>
						)}
						<div className="mb-6">
							<h2 className="text-white font-bold text-lg mb-1">{name}</h2>
							<div className="flex items-baseline gap-1 mb-3">
								<span className="text-white text-4xl font-extrabold">{price}</span>
								<span className="text-slate-500 text-sm">{period}</span>
							</div>
							<p className="text-slate-400 text-sm leading-relaxed">{description}</p>
						</div>
						<ul className="space-y-2.5 mb-8 flex-1" role="list" aria-label={`Fonctionnalités ${name}`}>
							{features.map((f) => (
								<li key={f} className="flex items-start gap-2 text-sm text-slate-300">
									<CheckIcon />
									{f}
								</li>
							))}
						</ul>
						<Button
							text={cta}
							variant={ctaVariant}
							href="/inscription"
							className="w-full justify-center py-3"
						/>
					</li>
				))}
			</ul>

			{/* FAQ */}
			<section aria-labelledby="faq-heading">
				<h2 id="faq-heading" className="text-white text-2xl font-extrabold mb-6">
					Questions fréquentes
				</h2>
				<dl className="space-y-4 max-w-2xl">
					{FAQ.map(({ q, a }) => (
						<div key={q} className="bg-[#161B22] border border-white/5 rounded-xl px-6 py-5">
							<dt className="text-white font-semibold text-sm mb-2">{q}</dt>
							<dd className="text-slate-400 text-sm leading-relaxed">{a}</dd>
						</div>
					))}
				</dl>
			</section>
		</main>
	);
}

export default TarifsPage;
