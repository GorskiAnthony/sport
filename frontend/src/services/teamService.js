import api from "./api";
import { teams } from "../data/mockData";

export const getTeams = async () => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get("/teams");
	return Promise.resolve({ data: teams });
};

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

export default { getTeams, addTeam, deleteTeam };
