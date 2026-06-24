import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser]       = useState(null);
	const [loading, setLoading] = useState(true);

	// Lecture initiale depuis localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem("user");
			if (stored) setUser(JSON.parse(stored));
		} catch {
			localStorage.removeItem("user");
		} finally {
			setLoading(false);
		}
	}, []);

	const login = useCallback((userData, token) => {
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(userData));
		setUser(userData);
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

export default AuthContext;
