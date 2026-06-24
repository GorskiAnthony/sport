import api from "./api";

export const addTeam = async (payload) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.post("/teams", payload);
	return Promise.resolve({ data: { id: Date.now(), ...payload } });
};

export const deleteTeam = async (id) => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.delete(`/teams/${id}`);
	return Promise.resolve({ data: { success: true } });
};

export default { addTeam, deleteTeam };
