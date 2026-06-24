function AuthCard({ title, subtitle, children }) {
	return (
		<main className="flex-1 flex items-center justify-center px-4 py-12">
			<div className="w-full max-w-md bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-2xl">
				<div className="flex justify-center mb-6">
					<img src="/logo_white.png" alt="Tournoi Center" className="h-10 w-auto" />
				</div>
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
