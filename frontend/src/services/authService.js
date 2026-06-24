import api from "./api";
import { mockUsers } from "../data/dashboardMockData";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const login = async ({ email, password }) => {
	await delay(600); // simulate network latency

	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/auth/login", { email, password });

	const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

	if (!user) {
		const err = new Error("Aucun compte trouvé avec cet email.");
		err.code = "EMAIL_NOT_FOUND";
		throw err;
	}
	if (user.password !== password) {
		const err = new Error("Mot de passe incorrect.");
		err.code = "WRONG_PASSWORD";
		throw err;
	}

	const { password: _pwd, ...userData } = user;
	return { data: { token: user.token, user: userData } };
};

export const register = async (payload) => {
	await delay(700);

	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/auth/register", payload);

	const exists = mockUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
	if (exists) {
		const err = new Error("Un compte existe déjà avec cet email.");
		err.code = "EMAIL_TAKEN";
		throw err;
	}

	return {
		data: {
			token: `mock-token-${Date.now()}`,
			user: { email: payload.email, name: payload.name, role: payload.role },
		},
	};
};

export const forgotPassword = async (email) => {
	await delay(500);
	// TODO: return api.post("/auth/forgot-password", { email });
	const exists = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
	if (!exists) {
		const err = new Error("Aucun compte associé à cet email.");
		err.code = "EMAIL_NOT_FOUND";
		throw err;
	}
	return { data: { message: "Email de réinitialisation envoyé." } };
};

export default { login, register, forgotPassword };
