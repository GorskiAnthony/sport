function ConfirmModal({
	title,
	message,
	confirmLabel = "Supprimer",
	onConfirm,
	onClose,
}) {
	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
		>
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div className="relative w-full max-w-sm bg-[#161B22] border border-white/10 rounded-2xl p-6 shadow-2xl">
				{/* Icon + text */}
				<div className="flex items-start gap-4 mb-6">
					<div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
							<polyline points="3 6 5 6 21 6"/>
							<path d="M19 6l-1 14H6L5 6"/>
							<path d="M10 11v6M14 11v6"/>
							<path d="M9 6V4h6v2"/>
						</svg>
					</div>
					<div>
						<h2 id="confirm-title" className="text-white font-semibold">{title}</h2>
						{message && (
							<p className="text-slate-400 text-sm mt-1">{message}</p>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
					>
						Annuler
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ConfirmModal;
