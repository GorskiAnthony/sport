function FormSelect({ id, label, value, onChange, options, placeholder, required, error }) {
	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label htmlFor={id} className="text-slate-300 text-sm font-medium">
					{label}
				</label>
			)}
			<select
				id={id}
				value={value}
				onChange={onChange}
				required={required}
				aria-invalid={!!error}
				aria-describedby={error ? `${id}-error` : undefined}
				className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow appearance-none cursor-pointer"
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map(({ value: v, label: l }) => (
					<option key={v} value={v}>
						{l}
					</option>
				))}
			</select>
			{error && (
				<p id={`${id}-error`} role="alert" className="text-red-400 text-xs">
					{error}
				</p>
			)}
		</div>
	);
}

export default FormSelect;
