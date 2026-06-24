import { useState, useEffect } from "react";
import { getFeatures } from "../services/featureService";

function FeatureCard({ icon, iconBg, title, description }) {
	return (
		<article className="bg-[#161B22] border border-white/5 rounded-xl p-6 hover:border-green-500/30 transition-colors duration-300">
			<div
				className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center text-xl mb-4`}
				aria-hidden="true"
			>
				{icon}
			</div>
			<h3 className="text-white font-semibold text-base mb-2">{title}</h3>
			<p className="text-slate-400 text-sm leading-relaxed">{description}</p>
		</article>
	);
}

function FeatureCardSkeleton() {
	return (
		<div className="bg-[#161B22] border border-white/5 rounded-xl p-6 animate-pulse">
			<div className="w-11 h-11 rounded-lg bg-white/5 mb-4" />
			<div className="h-4 bg-white/5 rounded w-2/3 mb-3" />
			<div className="space-y-2">
				<div className="h-3 bg-white/5 rounded" />
				<div className="h-3 bg-white/5 rounded w-4/5" />
			</div>
		</div>
	);
}

function FeaturesSection() {
	const [features, setFeatures] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getFeatures()
			.then(({ data }) => setFeatures(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<section className="bg-[#0D1117] py-20 px-6" aria-labelledby="features-heading">
			<div className="max-w-7xl mx-auto">
				<div className="max-w-lg mb-12">
					<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
						Pourquoi choisir Tourneo ?
					</p>
					<h2
						id="features-heading"
						className="text-white text-3xl md:text-4xl font-extrabold leading-tight"
					>
						Tout ce qu'il vous faut,{" "}
						<span className="text-green-400">au même endroit.</span>
					</h2>
					<p className="mt-4 text-slate-400 text-sm leading-relaxed">
						Que vous soyez organisateur, éducateur ou joueur, Tourneo simplifie la gestion et la participation à vos tournois.
					</p>
				</div>

				<ul
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
					role="list"
					aria-label="Fonctionnalités de Tourneo"
					aria-busy={loading}
				>
					{loading
						? [1, 2, 3, 4].map((i) => (
								<li key={i}>
									<FeatureCardSkeleton />
								</li>
						  ))
						: features.map((feature) => (
								<li key={feature.id}>
									<FeatureCard {...feature} />
								</li>
						  ))}
				</ul>
			</div>
		</section>
	);
}

export default FeaturesSection;
