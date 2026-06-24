import Button from "./Button";
import heroBg from "../assets/hero.png";

function PlayButton() {
	return (
		<button
			type="button"
			aria-label="Lire la vidéo de présentation"
			className="absolute inset-0 flex items-center justify-center group focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-xl"
		>
			<span
				className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg group-hover:bg-green-400 transition-colors duration-200"
				aria-hidden="true"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="currentColor"
					className="text-black ml-1"
					aria-hidden="true"
				>
					<path d="M4 3.5l13 6.5-13 6.5V3.5z" />
				</svg>
			</span>
		</button>
	);
}

function CommunitySection() {
	return (
		<section
			className="bg-[#0D1117] py-20 px-6"
			aria-labelledby="community-heading"
		>
			<div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
				{/* Left — video thumbnail */}
				<div className="w-full lg:w-1/2 flex-shrink-0">
					<div className="relative rounded-xl overflow-hidden aspect-video bg-[#161B22]">
						<img
							src={heroBg}
							alt="Des joueurs de football en action sur un terrain"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/40" aria-hidden="true" />
						<PlayButton />
					</div>
				</div>

				{/* Right — CTA text */}
				<div className="w-full lg:w-1/2">
					<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
						Prêt à relever le défi ?
					</p>
					<h2
						id="community-heading"
						className="text-white text-3xl md:text-4xl font-extrabold leading-tight"
					>
						Rejoignez la communauté{" "}
						<span className="text-green-400">des passionnés.</span>
					</h2>
					<p className="mt-5 text-slate-400 text-sm leading-relaxed">
						Créez votre compte gratuitement et accédez à tous les tournois disponibles ou lancez le vôtre en quelques minutes.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-4">
						<Button text="Créer un compte" variant="primary" href="#inscription" arrow />
						<Button text="En savoir plus" variant="outline" href="#a-propos" />
					</div>
				</div>
			</div>
		</section>
	);
}

export default CommunitySection;
