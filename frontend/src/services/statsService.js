import api from "./api";
import { platformStats } from "../data/mockData";

export const getPlatformStats = async () => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get("/stats");
	return Promise.resolve({ data: platformStats });
};

export default { getPlatformStats };
