export const K = {
	tournaments: "tc_tournaments",
	teams:       "tc_teams",
	matches:     "tc_matches",
};

export function write(key, data) {
	try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function getOrSeed(key, mockData) {
	const raw = localStorage.getItem(key);

	if (raw !== null) {
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				const clean = parsed.filter(Boolean);
				if (clean.length !== parsed.length) write(key, clean); // auto-repair
				return clean;
			}
		} catch {}
		// Stored value is not a valid array — re-seed
		write(key, mockData);
		return mockData;
	}

	write(key, mockData);
	return mockData;
}

export function read(key, fallback = []) {
	return getOrSeed(key, fallback);
}
