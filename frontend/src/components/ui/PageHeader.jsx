function PageHeader({ badge, title, highlight, subtitle }) {
	return (
		<div className="max-w-2xl mb-10">
			{badge && (
				<p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
					{badge}
				</p>
			)}
			<h1 className="text-white text-3xl md:text-4xl font-extrabold leading-tight">
				{title}{" "}
				{highlight && <span className="text-green-400">{highlight}</span>}
			</h1>
			{subtitle && (
				<p className="mt-3 text-slate-400 text-sm leading-relaxed">{subtitle}</p>
			)}
		</div>
	);
}

export default PageHeader;
