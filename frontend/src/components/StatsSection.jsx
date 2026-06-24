import { useState, useEffect } from "react";
import heroBg from "../assets/hero.png";
import { getPlatformStats } from "../services/statsService";

function StatItem({ value, label }) {
	return (
		<div>
			<p className="text-green-400 text-3xl font-extrabold" aria-label={`${value} ${label}`}>
				{value}
			</p>
			<p className="text-slate-400 text-sm mt-1" aria-hidden="true">
				{label}
			</p>
		</div>
	);
}

function StatItemSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="h-9 bg-white/5 rounded w-20 mb-2" />
			<div className="h-3 bg-white/5 rounded w-28" />
		</div>
	);
}

function StatsSection() {
	const [stats, setStats] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getPlatformStats()
			.then(({ data }) => setStats(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<section className="bg-[#0D1117] py-20 px-6" aria-labelledby="stats-heading">
			<div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
				<div className="w-full lg:w-1/2">
					<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
						Un outil pensé pour le football
					</p>
					<h2
						id="stats-heading"
						className="text-white text-3xl md:text-4xl font-extrabold leading-tight"
					>
						Tournoi Center accompagne
					</h2>
					<p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
						Tournoi Center accompagne des centaines d'organisateurs et des milliers d'équipes chaque année dans la réussite de leurs tournois.
					</p>

					<dl
						className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8"
						aria-busy={loading}
						aria-label="Statistiques de la plateforme"
					>
						{loading
							? [1, 2, 3, 4].map((i) => (
									<div key={i}>
										<StatItemSkeleton />
									</div>
							  ))
							: stats.map((stat) => (
									<div key={stat.id}>
										<StatItem {...stat} />
									</div>
							  ))}
					</dl>
				</div>

				<div className="w-full lg:w-1/2">
					<div className="rounded-xl overflow-hidden aspect-video">
						<img
							src={heroBg}
							alt="Ballon de football et crampons sur un terrain"
							className="w-full h-full object-cover"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

export default StatsSection;
