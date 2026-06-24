import api from "./api";
import { organizers } from "../data/mockData";

export const getOrganizers = async () => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get("/organizers");
	return Promise.resolve({ data: organizers });
};

export default { getOrganizers };
