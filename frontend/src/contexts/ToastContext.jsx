import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

/* ─── Individual toast ─────────────────────────────────────────── */
const ICONS = {
	success: (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	),
	error: (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
		</svg>
	),
	warning: (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	),
	info: (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
		</svg>
	),
};

const STYLES = {
	success: { icon: "text-green-400",  border: "border-green-500/40",  bar: "bg-green-500" },
	error:   { icon: "text-red-400",    border: "border-red-500/40",    bar: "bg-red-500" },
	warning: { icon: "text-amber-400",  border: "border-amber-500/40",  bar: "bg-amber-500" },
	info:    { icon: "text-blue-400",   border: "border-blue-500/40",   bar: "bg-blue-500" },
};

function Toast({ id, type = "info", title, message, duration, onRemove }) {
	const [leaving, setLeaving] = useState(false);
	const s = STYLES[type] ?? STYLES.info;

	const dismiss = useCallback(() => {
		setLeaving(true);
		setTimeout(() => onRemove(id), 300);
	}, [id, onRemove]);

	useEffect(() => {
		const t = setTimeout(dismiss, duration);
		return () => clearTimeout(t);
	}, [dismiss, duration]);

	return (
		<div
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			className={`relative flex items-start gap-3 w-80 bg-[#161B22] border ${s.border} rounded-xl px-4 py-3.5 shadow-2xl overflow-hidden`}
			style={{ animation: leaving ? "toast-out 0.3s ease forwards" : "toast-in 0.35s ease" }}
		>
			{/* Icon */}
			<span className={`flex-shrink-0 mt-0.5 ${s.icon}`}>{ICONS[type]}</span>

			{/* Text */}
			<div className="flex-1 min-w-0">
				{title && <p className="text-white text-sm font-semibold leading-tight">{title}</p>}
				{message && <p className={`text-slate-400 text-xs leading-relaxed ${title ? "mt-0.5" : "text-sm text-slate-300"}`}>{message}</p>}
			</div>

			{/* Close */}
			<button
				onClick={dismiss}
				aria-label="Fermer la notification"
				className="flex-shrink-0 text-slate-500 hover:text-white transition-colors focus-visible:outline-none"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			{/* Progress bar */}
			<span
				className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-60`}
				style={{ animation: `toast-progress ${duration}ms linear forwards` }}
				aria-hidden="true"
			/>
		</div>
	);
}

/* ─── Provider ─────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const toast = useCallback(({ type = "info", title, message, duration = 4000 }) => {
		const id = Date.now() + Math.random();
		setToasts((prev) => [...prev, { id, type, title, message, duration }]);
	}, []);

	const removeToast = useCallback((id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	// Shorthand helpers
	toast.success = (message, title) => toast({ type: "success", title, message });
	toast.error   = (message, title) => toast({ type: "error",   title, message });
	toast.warning = (message, title) => toast({ type: "warning", title, message });
	toast.info    = (message, title) => toast({ type: "info",    title, message });

	return (
		<ToastContext.Provider value={toast}>
			{children}
			{/* Toast container — fixed top-right */}
			<div
				aria-label="Notifications"
				className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
			>
				{toasts.map((t) => (
					<div key={t.id} className="pointer-events-auto">
						<Toast {...t} onRemove={removeToast} />
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}

export default ToastContext;
