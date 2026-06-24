const PROVIDERS = [
	{
		id: "google",
		label: "Se connecter avec Google",
		icon: (
			<span className="text-red-500 font-bold text-base" aria-hidden="true">G</span>
		),
	},
	{
		id: "apple",
		label: "Se connecter avec Apple",
		icon: (
			<svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" className="text-white" aria-hidden="true">
				<path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 175 46.4 42.3 0 108.7-49.1 190.5-49.1zm-78-159.8c37.1-44.3 63.6-105.8 63.6-167.3 0-8.3-.6-16.7-2-24.4-60.4 2.3-132.1 40.2-175.1 91.5-34.1 38.9-65.5 100.4-65.5 162.7 0 9 1.4 18 2 20.9 3.8.6 10 1.4 16.2 1.4 53.9 0 120.5-35.7 160.8-84.8z" />
			</svg>
		),
	},
	{
		id: "facebook",
		label: "Se connecter avec Facebook",
		icon: (
			<span className="text-blue-500 font-bold text-base" aria-hidden="true">f</span>
		),
	},
];

function SocialAuthButtons({ action = "connecter" }) {
	return (
		<div>
			<div className="flex items-center gap-3 my-5" aria-hidden="true">
				<div className="flex-1 h-px bg-white/10" />
				<span className="text-slate-500 text-xs">ou continuer avec</span>
				<div className="flex-1 h-px bg-white/10" />
			</div>
			<div className="flex gap-3" role="group" aria-label={`Se ${action} avec un réseau social`}>
				{PROVIDERS.map(({ id, label, icon }) => (
					<button
						key={id}
						type="button"
						aria-label={label}
						className="flex-1 flex items-center justify-center h-10 bg-[#0D1117] border border-white/10 rounded-lg hover:border-white/30 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
					>
						{icon}
					</button>
				))}
			</div>
		</div>
	);
}

export default SocialAuthButtons;
