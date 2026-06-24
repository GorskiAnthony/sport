import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Layouts — imports statiques obligatoires
// React.lazy() sur un layout qui contient <Outlet /> casse RouterProvider
import DashboardLayout from "./layouts/DashboardLayout";
import SpectatorLayout from "./layouts/SpectatorLayout";

/* ─── Lazy pages (code splitting par route) ────────────────────── */
const HomePage                 = lazy(() => import("./pages/HomePage"));
const SpectatorHomePage        = lazy(() => import("./pages/SpectatorHomePage"));
const LoginPage                = lazy(() => import("./pages/LoginPage"));
const RegisterPage             = lazy(() => import("./pages/RegisterPage"));
const CreateTournamentPage     = lazy(() => import("./pages/CreateTournamentPage"));
const AddTeamPage              = lazy(() => import("./pages/AddTeamPage"));
const SportsPage               = lazy(() => import("./pages/SportsPage"));
const TournoisPage             = lazy(() => import("./pages/TournoisPage"));
const EquipesPage              = lazy(() => import("./pages/EquipesPage"));
const OrganisateursPage        = lazy(() => import("./pages/OrganisateursPage"));
const AProposPage              = lazy(() => import("./pages/AProposPage"));
const TarifsPage               = lazy(() => import("./pages/TarifsPage"));
const NotFoundPage             = lazy(() => import("./pages/NotFoundPage"));
const PublicTournamentPage     = lazy(() => import("./pages/PublicTournamentPage"));
const SpectatorClassementsPage = lazy(() => import("./pages/spectator/ClassementsPage"));
const SpectatorFavorisPage     = lazy(() => import("./pages/spectator/FavorisPage"));
const DashboardPage            = lazy(() => import("./pages/dashboard/DashboardPage"));
const DashboardMatchsPage      = lazy(() => import("./pages/dashboard/MatchsPage"));
const DashboardEquipesPage     = lazy(() => import("./pages/dashboard/EquipesPage"));
const DashboardTournoisPage    = lazy(() => import("./pages/dashboard/TournoisPage"));

/* ─── Loader Suspense ──────────────────────────────────────────── */
function PageLoader() {
	return (
		<div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
			<output aria-label="Chargement…">
				<div className="w-8 h-8 rounded-full border-2 border-green-500/20 border-t-green-500 animate-spin" aria-hidden="true" />
			</output>
		</div>
	);
}

/* ─── Layout wrappers (Outlet, pas children) ───────────────────── */
function PublicLayout() {
	return (
		<div className="bg-[#0D1117] text-white min-h-screen flex flex-col">
			<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-green-500 focus:text-black focus:px-4 focus:py-2 focus:rounded font-semibold">
				Aller au contenu principal
			</a>
			<Navbar />
			<Outlet />
			<Footer />
		</div>
	);
}

function PublicLayoutNoFooter() {
	return (
		<div className="bg-[#0D1117] text-white min-h-screen flex flex-col">
			<Navbar />
			<Outlet />
		</div>
	);
}

/* ─── Router ───────────────────────────────────────────────────── */
const router = createBrowserRouter([
	/* Auth — sans footer (en premier : chemins spécifiques prioritaires) */
	{
		element: <PublicLayoutNoFooter />,
		children: [
			{ path: "/connexion",             element: <LoginPage /> },
			{ path: "/inscription",           element: <RegisterPage /> },
			{ path: "/inscription/tournoi",   element: <CreateTournamentPage /> },
			{ path: "/inscription/equipes",   element: <AddTeamPage /> },
		],
	},

	/* Spectateur — sidebar persistante sur toutes ses pages */
	{
		path: "/accueil",
		element: <SpectatorLayout />,
		children: [
			{ index: true,         element: <SpectatorHomePage /> },
			{ path: "tournois",    element: <TournoisPage /> },
			{ path: "sports",      element: <SportsPage /> },
			{ path: "equipes",     element: <EquipesPage /> },
			{ path: "classements", element: <SpectatorClassementsPage /> },
			{ path: "favoris",     element: <SpectatorFavorisPage /> },
		],
	},

	/* Dashboard organisateur */
	{
		path: "/dashboard",
		element: <DashboardLayout />,
		children: [
			{ index: true,      element: <DashboardPage /> },
			{ path: "matchs",   element: <DashboardMatchsPage /> },
			{ path: "equipes",  element: <DashboardEquipesPage /> },
			{ path: "tournois", element: <DashboardTournoisPage /> },
		],
	},

	/* QR code — layout autonome */
	{ path: "/tournoi/:id", element: <PublicTournamentPage /> },

	/* Pages publiques — avec footer (après les routes spécifiques) */
	{
		element: <PublicLayout />,
		children: [
			{ index: true,            element: <HomePage /> },
			{ path: "/sports",        element: <SportsPage /> },
			{ path: "/tournois",      element: <TournoisPage /> },
			{ path: "/equipes",       element: <EquipesPage /> },
			{ path: "/organisateurs", element: <OrganisateursPage /> },
			{ path: "/a-propos",      element: <AProposPage /> },
			{ path: "/tarifs",        element: <TarifsPage /> },
		],
	},

	/* 404 — route dédiée hors du pathless PublicLayout pour éviter les conflits */
	{
		path: "*",
		element: (
			<div className="bg-[#0D1117] text-white min-h-screen flex flex-col">
				<Navbar />
				<Suspense fallback={<PageLoader />}>
					<NotFoundPage />
				</Suspense>
				<Footer />
			</div>
		),
	},
]);

/* ─── App ──────────────────────────────────────────────────────── */
export default function App() {
	return (
		<Suspense fallback={<PageLoader />}>
			<RouterProvider router={router} />
		</Suspense>
	);
}
