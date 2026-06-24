function TourneoLogo() {
	return (
		<div className="flex justify-center mb-6" aria-hidden="true">
			<span className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl shadow-lg shadow-green-500/20">
				<svg width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="9" cy="9" r="7" stroke="black" strokeWidth="2" />
					<path d="M9 5v4l3 2" stroke="black" strokeWidth="2" strokeLinecap="round" />
				</svg>
			</span>
		</div>
	);
}

function AuthCard({ title, subtitle, children }) {
	return (
		<main className="flex-1 flex items-center justify-center px-4 py-12">
			<div className="w-full max-w-md bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-2xl">
				<TourneoLogo />
				<h1 className="text-white text-2xl font-bold text-center mb-1">{title}</h1>
				{subtitle && (
					<p className="text-slate-400 text-sm text-center mb-6">{subtitle}</p>
				)}
				{children}
			</div>
		</main>
	);
}

export default AuthCard;
