function Button({ text, variant = "outline", href, onClick, type = "button", className = "", arrow = false }) {
	const base =
		"inline-flex items-center gap-2 px-5 py-2.5 rounded font-medium text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500";

	const variants = {
		primary:
			"bg-green-500 hover:bg-green-600 text-black focus-visible:outline-green-500",
		outline:
			"border border-slate-400 text-slate-300 hover:text-white hover:bg-[#161B22] focus-visible:outline-slate-400",
		ghost:
			"text-slate-300 hover:text-white hover:bg-[#161B22] focus-visible:outline-slate-400",
	};

	const classes = `${base} ${variants[variant]} ${className}`;

	if (href) {
		return (
			<a href={href} className={classes}>
				{text}
				{arrow && <span aria-hidden="true">→</span>}
			</a>
		);
	}

	return (
		<button type={type} onClick={onClick} className={classes}>
			{text}
			{arrow && <span aria-hidden="true">→</span>}
		</button>
	);
}

export default Button;
