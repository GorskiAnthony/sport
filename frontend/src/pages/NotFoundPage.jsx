import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

/* ─── Physics constants ────────────────────────────────────────── */
const GRAVITY       = 0.55;
const RESTITUTION_W = 0.72;   // wall bounce energy kept
const RESTITUTION_F = 0.60;   // floor bounce energy kept
const FRICTION_AIR  = 0.994;  // per-frame air friction
const FRICTION_FLOOR= 0.86;   // extra x-friction when on floor
const BALL_PX       = 64;     // approximate ball size in px
const SETTLE_SPEED  = 0.8;    // px/frame below which we consider "settled"

/* ─── Spark particles ──────────────────────────────────────────── */
function Spark({ x, y, angle, color }) {
	return (
		<span
			aria-hidden="true"
			className="pointer-events-none fixed z-[60] w-2 h-2 rounded-full"
			style={{
				left: x,
				top: y,
				background: color,
				animation: "spark-out 0.55s ease-out forwards",
				"--dx": `${Math.cos(angle) * (40 + Math.random() * 40)}px`,
				"--dy": `${Math.sin(angle) * (40 + Math.random() * 40)}px`,
			}}
		/>
	);
}

/* ─── Interactive ball ─────────────────────────────────────────── */
function InteractiveBall({ onKick }) {
	const ballRef     = useRef(null);   // wrapper in the flow (for position capture)
	const fixedRef    = useRef(null);   // fixed clone driven by RAF
	const posRef      = useRef({ x: 0, y: 0 });
	const velRef      = useRef({ x: 0, y: 0 });
	const rotRef      = useRef(0);
	const rafRef      = useRef(null);
	const settleRef   = useRef(null);
	const [physics, setPhysics] = useState(false);
	const [sparks,  setSparks]  = useState([]);

	const cancelLoop = useCallback(() => {
		if (rafRef.current)    cancelAnimationFrame(rafRef.current);
		if (settleRef.current) clearTimeout(settleRef.current);
	}, []);

	const spawnSparks = useCallback((cx, cy) => {
		const colors = ["#22c55e", "#86efac", "#fff", "#fbbf24"];
		const count  = 10;
		const next   = Array.from({ length: count }, (_, i) => ({
			id:    Date.now() + i,
			x:     cx - 4,
			y:     cy - 4,
			angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
			color: colors[Math.floor(Math.random() * colors.length)],
		}));
		setSparks((s) => [...s, ...next]);
		setTimeout(() => setSparks((s) => s.filter((p) => !next.find((n) => n.id === p.id))), 600);
	}, []);

	const runPhysics = useCallback(() => {
		const loop = () => {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const p  = posRef.current;
			const v  = velRef.current;

			// gravity
			v.y += GRAVITY;
			// air friction
			v.x *= FRICTION_AIR;

			p.x += v.x;
			p.y += v.y;

			// left / right walls
			if (p.x <= 0) {
				p.x = 0;
				v.x = Math.abs(v.x) * RESTITUTION_W;
				spawnSparks(0, p.y + BALL_PX / 2);
			}
			if (p.x >= vw - BALL_PX) {
				p.x = vw - BALL_PX;
				v.x = -Math.abs(v.x) * RESTITUTION_W;
				spawnSparks(vw, p.y + BALL_PX / 2);
			}

			// ceiling
			if (p.y <= 0) {
				p.y = 0;
				v.y = Math.abs(v.y) * RESTITUTION_W;
			}

			// floor
			const floorY = vh - BALL_PX - 8;
			if (p.y >= floorY) {
				p.y = floorY;
				v.y = -Math.abs(v.y) * RESTITUTION_F;
				v.x *= FRICTION_FLOOR;
				if (Math.abs(v.y) > 3) spawnSparks(p.x + BALL_PX / 2, floorY + BALL_PX);
			}

			// rotation proportional to horizontal speed
			rotRef.current += v.x * 2.8;

			// drive fixed ball DOM directly (zero React renders during loop)
			if (fixedRef.current) {
				fixedRef.current.style.transform =
					`translate(${p.x}px, ${p.y}px) rotate(${rotRef.current}deg)`;
			}

			const speed = Math.hypot(v.x, v.y);
			if (speed > SETTLE_SPEED || p.y < floorY - 2) {
				rafRef.current = requestAnimationFrame(loop);
			} else {
				// settled — wait a beat then return to float
				settleRef.current = setTimeout(() => setPhysics(false), 2200);
			}
		};
		rafRef.current = requestAnimationFrame(loop);
	}, [spawnSparks]);

	const kick = useCallback((e) => {
		e.stopPropagation();

		// determine kick direction from click position relative to ball centre
		const rect = (physics ? fixedRef.current : ballRef.current)?.getBoundingClientRect();
		if (!rect) return;

		const cx = rect.left + rect.width  / 2;
		const cy = rect.top  + rect.height / 2;
		// vector from click-point to ball centre → ball flies "away from cursor"
		const dx = cx - e.clientX;
		const dy = cy - e.clientY;
		const dist = Math.hypot(dx, dy) || 1;
		const power = 18 + Math.random() * 8;

		if (!physics) {
			posRef.current = { x: rect.left, y: rect.top };
			setPhysics(true);
		}

		cancelLoop();
		velRef.current = {
			x: (dx / dist) * power,
			y: (dy / dist) * power - 4, // slight upward bias
		};

		spawnSparks(cx, cy);
		onKick();
		runPhysics();
	}, [physics, cancelLoop, spawnSparks, onKick, runPhysics]);

	// keyboard support: Enter / Space also kicks
	const handleKey = useCallback((e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const rect = ballRef.current?.getBoundingClientRect();
			if (rect) {
				// simulate a click in the bottom half
				kick({ stopPropagation: () => {}, clientX: rect.left + rect.width / 2, clientY: rect.bottom });
			}
		}
	}, [kick]);

	useEffect(() => () => cancelLoop(), [cancelLoop]);

	return (
		<>
			{/* Sparks (rendered outside the ball element) */}
			{sparks.map((s) => <Spark key={s.id} {...s} />)}

			{/* Physics clone — fixed, driven by RAF */}
			{physics && (
				<div
					ref={fixedRef}
					className="fixed top-0 left-0 text-[64px] cursor-pointer z-50 select-none"
					style={{ willChange: "transform", lineHeight: 1 }}
					onClick={kick}
					aria-hidden="true"
				>
					⚽
				</div>
			)}

			{/* In-flow placeholder (always rendered so layout stays stable) */}
			<div
				ref={ballRef}
				role="button"
				tabIndex={0}
				aria-label="Ballon de football — cliquez pour le botter"
				onClick={kick}
				onKeyDown={handleKey}
				className={`text-[64px] cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-500 rounded-full ${
					physics ? "opacity-0 pointer-events-none" : ""
				}`}
				style={physics ? undefined : { animation: "float 4s ease-in-out infinite" }}
			>
				⚽
			</div>
		</>
	);
}

/* ─── Background decorations ───────────────────────────────────── */
function RadarRing({ delay }) {
	return (
		<span
			aria-hidden="true"
			className="absolute rounded-full border border-green-500/30 w-72 h-72"
			style={{ top: "50%", left: "50%", animation: `radar-ring 3.5s ease-out ${delay}s infinite` }}
		/>
	);
}

function GlitchedTitle() {
	return (
		<div className="relative select-none" aria-hidden="true">
			<span className="absolute inset-0 text-green-400 font-black text-[160px] md:text-[220px] leading-none opacity-80"
				style={{ animation: "glitch-1 6s infinite", left: "3px" }}>
				404
			</span>
			<span className="absolute inset-0 text-red-400 font-black text-[160px] md:text-[220px] leading-none opacity-60"
				style={{ animation: "glitch-2 6s infinite", left: "-3px" }}>
				404
			</span>
			<span className="relative text-white font-black text-[160px] md:text-[220px] leading-none"
				style={{ animation: "glow-pulse 3s ease-in-out infinite" }}>
				404
			</span>
		</div>
	);
}

/* ─── Main page ────────────────────────────────────────────────── */
function NotFoundPage() {
	const [kicks, setKicks] = useState(0);

	const handleKick = useCallback(() => setKicks((k) => k + 1), []);

	return (
		<main
			id="main-content"
			className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[calc(100vh-4rem)] px-6 text-center"
			aria-labelledby="notfound-heading"
		>
			{/* Grid background */}
			<div aria-hidden="true" className="absolute inset-0 opacity-[0.04]"
				style={{
					backgroundImage: "linear-gradient(rgba(34,197,94,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,1) 1px,transparent 1px)",
					backgroundSize: "60px 60px",
					animation: "grid-drift 8s linear infinite",
				}}
			/>
			{/* Scan line */}
			<div aria-hidden="true" className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent pointer-events-none"
				style={{ animation: "scan-line 4s linear infinite" }}
			/>
			{/* Vignette */}
			<div aria-hidden="true" className="absolute inset-0 pointer-events-none"
				style={{ background: "radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.7) 100%)" }}
			/>

			{/* Radar rings */}
			<div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<RadarRing delay={0} />
				<RadarRing delay={1.1} />
				<RadarRing delay={2.3} />
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center gap-4">

				{/* Kick counter */}
				<div className="h-7" style={{ animation: "fade-in-up .5s ease both" }}>
					{kicks > 0 && (
						<p className="text-green-400 text-sm font-mono font-semibold" aria-live="polite" aria-atomic="true">
							{kicks === 1 ? "1 coup" : `${kicks} coups`}
							{kicks >= 10 && " 🔥"}
							{kicks >= 25 && " vous êtes fou"}
						</p>
					)}
				</div>

				{/* Interactive ball */}
				<div style={{ animation: "fade-in-up .5s ease both" }}>
					<InteractiveBall onKick={handleKick} />
				</div>

				{/* 404 */}
				<div style={{ animation: "fade-in-up .6s .1s ease both" }}>
					<GlitchedTitle />
				</div>

				<div style={{ animation: "fade-in-up .6s .25s ease both" }}>
					<h1 id="notfound-heading" className="text-white text-2xl md:text-3xl font-extrabold -mt-4">
						Page introuvable
					</h1>
				</div>

				<p className="text-slate-400 text-sm md:text-base max-w-sm leading-relaxed"
					style={{ animation: "fade-in-up .6s .35s ease both", opacity: 0 }}>
					Le coup franc a raté la cible. Cette page n'existe pas ou a été déplacée.
				</p>

				<div className="flex flex-wrap items-center justify-center gap-3 mt-4"
					style={{ animation: "fade-in-up .6s .45s ease both", opacity: 0 }}>
					<Link to="/"
						className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-6 py-3 rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500">
						← Retour à l'accueil
					</Link>
					<Link to="/tournaments"
						className="inline-flex items-center gap-2 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-semibold text-sm px-6 py-3 rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500">
						Voir les tournois
					</Link>
				</div>

				<p className="text-slate-600 text-xs mt-6 font-mono"
					style={{ animation: "fade-in-up .6s .55s ease both", opacity: 0 }}
					aria-hidden="true">
					ERR_ROUTE_NOT_FOUND · 0x00000404
				</p>
			</div>
		</main>
	);
}

export default NotFoundPage;
