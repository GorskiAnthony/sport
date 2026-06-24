import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "../../contexts/ToastContext";

function buildPrintHTML({ tournament, url, svgString }) {
	const STATUS_COLOR = tournament.status === "En cours" ? "#22c55e" : "#f59e0b";

	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>QR Code — ${tournament.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fff;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 24px;
    }

    .card {
      width: 380px;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }

    /* Header band */
    .header {
      background: #0f172a;
      padding: 24px 28px 20px;
      text-align: center;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
    }

    .brand-icon {
      width: 32px; height: 32px;
      background: #22c55e;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }

    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 3px 10px;
      border-radius: 999px;
      color: ${STATUS_COLOR};
      border: 1px solid ${STATUS_COLOR}55;
      background: ${STATUS_COLOR}18;
      margin-bottom: 10px;
    }

    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: ${STATUS_COLOR};
      ${tournament.status === "En cours" ? "animation: pulse 1.5s infinite;" : ""}
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .tournament-name {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .tournament-sub {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* QR zone */
    .qr-zone {
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      background: #fff;
    }

    .qr-wrapper {
      padding: 16px;
      border: 2px solid #f1f5f9;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    .qr-wrapper svg {
      display: block;
      width: 200px !important;
      height: 200px !important;
    }

    /* Info grid */
    .info-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .info-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .info-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 3px;
    }

    .info-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }

    /* CTA */
    .cta {
      text-align: center;
      padding: 0 28px 24px;
    }

    .cta-text {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .cta-sub {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }

    .url-box {
      margin-top: 12px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10px;
      font-family: monospace;
      color: #475569;
      word-break: break-all;
    }

    /* Footer */
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 12px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-brand {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    .footer-green { color: #22c55e; }

    .footer-note {
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 0; background: #fff; }
      .card { box-shadow: none; border: none; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
        </div>
        <span class="brand-name">Tournoi Center</span>
      </div>
      <div class="status-badge">
        <span class="dot"></span>
        ${tournament.status}
      </div>
      <h1 class="tournament-name">${tournament.name}</h1>
      <p class="tournament-sub">${tournament.sport} · ${tournament.category}</p>
    </div>

    <div class="qr-zone">
      <div class="qr-wrapper">
        ${svgString}
      </div>

      <div class="info-grid">
        <div class="info-cell">
          <p class="info-label">📅 Dates</p>
          <p class="info-value">${tournament.dates}</p>
        </div>
        <div class="info-cell">
          <p class="info-label">📍 Lieu</p>
          <p class="info-value">${tournament.location}</p>
        </div>
        <div class="info-cell">
          <p class="info-label">🏅 Catégorie</p>
          <p class="info-value">${tournament.category}</p>
        </div>
        <div class="info-cell">
          <p class="info-label">👥 Équipes</p>
          <p class="info-value">${tournament.teams} équipes</p>
        </div>
      </div>
    </div>

    <div class="cta">
      <p class="cta-text">Scannez pour suivre le tournoi en direct</p>
      <p class="cta-sub">Scores en temps réel, classements et résultats directement sur votre téléphone.</p>
      <div class="url-box">${url}</div>
    </div>

    <div class="footer">
      <span class="footer-brand">Tournoi<span class="footer-green">Center</span></span>
      <span class="footer-note">Plateforme de gestion de tournois</span>
    </div>
  </div>
  <script>
    window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
  </script>
</body>
</html>`;
}

function QRCodeModal({ tournament, onClose }) {
	const url        = `${window.location.origin}/tournoi/${tournament.id}`;
	const overlayRef = useRef(null);
	const qrRef      = useRef(null);
	const toast      = useToast();

	useEffect(() => {
		const onKey = (e) => { if (e.key === "Escape") onClose(); };
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleCopy = () => {
		navigator.clipboard.writeText(url)
			.then(() => toast.success("Lien copié dans le presse-papiers.", "Copié !"))
			.catch(() => {});
	};

	const handlePrint = () => {
		const svgEl = qrRef.current?.querySelector("svg");
		if (!svgEl) return;
		const svgString = new XMLSerializer().serializeToString(svgEl);
		const html = buildPrintHTML({ tournament, url, svgString });
		const win = window.open("", "_blank", "width=520,height=700");
		win.document.write(html);
		win.document.close();
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
				<div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-lg">
					<QRCodeSVG
						value={url}
						size={180}
						bgColor="#ffffff"
						fgColor="#0D1117"
						level="M"
						includeMargin={false}
					/>
				</div>

				{/* URL + copy */}
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

				{/* Actions */}
				<div className="w-full flex gap-2">
					<button
						onClick={handlePrint}
						className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
					>
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<polyline points="6 9 6 2 18 2 18 9" />
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
							<rect x="6" y="14" width="12" height="8" />
						</svg>
						Imprimer
					</button>
					<button
						onClick={onClose}
						className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 text-sm rounded-xl transition-colors"
					>
						Fermer
					</button>
				</div>

				<p className="text-slate-600 text-xs text-center -mt-2">
					Le spectateur scanne ce code et accède directement à la page du tournoi.
				</p>
			</div>
		</div>
	);
}

export default QRCodeModal;
