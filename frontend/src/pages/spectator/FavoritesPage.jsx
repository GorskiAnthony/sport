function FavorisPage() {
	return (
		<div className="max-w-3xl mx-auto px-6 py-10">
			<h1 className="text-white text-2xl font-extrabold mb-2">Favoris</h1>
			<p className="text-slate-400 text-sm mb-8">Vos tournois et équipes sauvegardés.</p>

			<div className="bg-[#161B22] border border-dashed border-white/10 rounded-2xl py-16 text-center">
				<div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" aria-hidden="true">
					❤️
				</div>
				<p className="text-white font-semibold">Aucun favori pour l'instant</p>
				<p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
					Scannez le QR code d'un tournoi ou naviguez vers une fiche équipe pour l'enregistrer ici.
				</p>
			</div>
		</div>
	);
}

export default FavorisPage;
