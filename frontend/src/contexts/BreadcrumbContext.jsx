import { createContext, useContext, useState } from "react";

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
	const [crumbs, setCrumbs] = useState([]);
	return (
		<BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumb(crumbs) {
	const ctx = useContext(BreadcrumbContext);
	// Called from pages to set their breadcrumb on mount
	if (crumbs && ctx) {
		ctx.setCrumbs(crumbs);
	}
	return ctx;
}

export default BreadcrumbContext;
