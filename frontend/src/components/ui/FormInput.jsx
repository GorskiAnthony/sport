function FormInput({
	id,
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	autoComplete,
	required = false,
	error,
	children,
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-slate-300 text-sm font-medium">
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					type={type}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					autoComplete={autoComplete}
					required={required}
					aria-invalid={!!error}
					aria-describedby={error ? `${id}-error` : undefined}
					className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow pr-10"
				/>
				{children}
			</div>
			{error && (
				<p id={`${id}-error`} role="alert" className="text-red-400 text-xs">
					{error}
				</p>
			)}
		</div>
	);
}

export default FormInput;
