import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

function QRCodeModal({ tournament, onClose }) {
	const url = `${window.location.origin}/tournoi/${tournament.id}`;
	const overlayRef = useRef(null);

	useEffect(() => {
		const onKey = (e) => { if (e.key === "Escape") onClose(); };
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleCopy = () => {
		navigator.clipboard.writeText(url).catch(() => {});
	};

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-[300] flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="qr-modal-title"
			onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
		>
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

			<div className="relative w-full max-w-sm bg-[#161B22] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5">
				{/* Close */}
				<button
					onClick={onClose}
					aria-label="Fermer"
					className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>

				{/* Header */}
				<div className="text-center">
					<p className="text-slate-400 text-xs uppercase tracking-widest mb-1">QR Code</p>
					<h2 id="qr-modal-title" className="text-white font-bold text-base leading-tight">
						{tournament.name}
					</h2>
					<p className="text-slate-500 text-xs mt-0.5">{tournament.sport} · {tournament.category}</p>
				</div>

				{/* QR */}
				<div className="p-4 bg-white rounded-2xl shadow-lg">
					<QRCodeSVG
						value={url}
						size={180}
						bgColor="#ffffff"
						fgColor="#0D1117"
						level="M"
						includeMargin={false}
					/>
				</div>

				{/* URL */}
				<div className="w-full bg-white/[0.04] border border-white/5 rounded-xl flex items-center gap-2 px-3 py-2">
					<p className="flex-1 text-slate-400 text-xs truncate font-mono">{url}</p>
					<button
						onClick={handleCopy}
						aria-label="Copier le lien"
						className="flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
							<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					</button>
				</div>

				<p className="text-slate-600 text-xs text-center">
					Le spectateur scanne ce code et accède directement à la page du tournoi.
				</p>
			</div>
		</div>
	);
}

export default QRCodeModal;
