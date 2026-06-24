import api from "./api";
import { features } from "../data/mockData";

export const getFeatures = async () => {
	// TODO: remplacer par l'appel réel quand le backend est prêt
	// return api.get("/features");
	return Promise.resolve({ data: features });
};

export default { getFeatures };
