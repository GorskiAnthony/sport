import api from "./api";

export const login = async (credentials) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/auth/login", credentials);
	return Promise.resolve({ data: { token: "mock-token", user: { email: credentials.email } } });
};

export const register = async (payload) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/auth/register", payload);
	return Promise.resolve({ data: { token: "mock-token", user: { email: payload.email } } });
};

export const forgotPassword = async (email) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/auth/forgot-password", { email });
	return Promise.resolve({ data: { message: "Email envoyé." } });
};

export default { login, register, forgotPassword };
