import { useState } from "react";
import FormInput from "./FormInput";

function EyeIcon({ open }) {
	return open ? (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	) : (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	);
}

function PasswordInput({ id, label, value, onChange, autoComplete, required, error }) {
	const [visible, setVisible] = useState(false);

	return (
		<FormInput
			id={id}
			label={label}
			type={visible ? "text" : "password"}
			placeholder="••••••••"
			value={value}
			onChange={onChange}
			autoComplete={autoComplete}
			required={required}
			error={error}
		>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
				aria-pressed={visible}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 rounded"
			>
				<EyeIcon open={visible} />
			</button>
		</FormInput>
	);
}

export default PasswordInput;
