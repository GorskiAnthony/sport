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
const SportsPage                  = lazy(() => import("./pages/SportsPage"));
const TournamentsPage             = lazy(() => import("./pages/TournamentsPage"));
const TeamsPage                   = lazy(() => import("./pages/TeamsPage"));
const OrganizersPage              = lazy(() => import("./pages/OrganizersPage"));
const AboutPage                   = lazy(() => import("./pages/AboutPage"));
const PricingPage                 = lazy(() => import("./pages/PricingPage"));
const NotFoundPage                = lazy(() => import("./pages/NotFoundPage"));
const PublicTournamentPage        = lazy(() => import("./pages/PublicTournamentPage"));
const SpectatorStandingsPage      = lazy(() => import("./pages/spectator/StandingsPage"));
const SpectatorFavoritesPage      = lazy(() => import("./pages/spectator/FavoritesPage"));
const DashboardPage               = lazy(() => import("./pages/dashboard/DashboardPage"));
const DashboardMatchesPage        = lazy(() => import("./pages/dashboard/MatchesPage"));
const DashboardMatchDetailPage    = lazy(() => import("./pages/dashboard/MatchDetailPage"));
const DashboardTeamsPage          = lazy(() => import("./pages/dashboard/TeamsPage"));
const DashboardTournamentsPage    = lazy(() => import("./pages/dashboard/TournamentsPage"));
const DashboardStandingsPage      = lazy(() => import("./pages/dashboard/StandingsPage"));
const DashboardMessagesPage       = lazy(() => import("./pages/dashboard/MessagesPage"));
const DashboardSettingsPage       = lazy(() => import("./pages/dashboard/SettingsPage"));
const DashboardNewTournamentPage  = lazy(() => import("./pages/dashboard/NewTournamentPage"));
const SpectatorSettingsPage       = lazy(() => import("./pages/spectator/SettingsPage"));

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
			{ path: "/login",             element: <LoginPage /> },
			{ path: "/register",           element: <RegisterPage /> },
			{ path: "/register/tournament",   element: <CreateTournamentPage /> },
			{ path: "/register/teams",   element: <AddTeamPage /> },
		],
	},

	/* Spectateur — sidebar persistante sur toutes ses pages */
	{
		path: "/home",
		element: <SpectatorLayout />,
		children: [
			{ index: true,        element: <SpectatorHomePage /> },
			{ path: "tournaments", element: <TournamentsPage /> },
			{ path: "sports",      element: <SportsPage /> },
			{ path: "teams",       element: <TeamsPage /> },
			{ path: "standings",   element: <SpectatorStandingsPage /> },
			{ path: "favorites",   element: <SpectatorFavoritesPage /> },
			{ path: "settings",    element: <SpectatorSettingsPage /> },
		],
	},

	/* Dashboard organisateur */
	{
		path: "/dashboard",
		element: <DashboardLayout />,
		children: [
			{ index: true,            element: <DashboardPage /> },
			{ path: "matches",        element: <DashboardMatchesPage /> },
			{ path: "matches/:id",    element: <DashboardMatchDetailPage /> },
			{ path: "teams",          element: <DashboardTeamsPage /> },
			{ path: "tournaments",    element: <DashboardTournamentsPage /> },
			{ path: "standings",      element: <DashboardStandingsPage /> },
			{ path: "messages",       element: <DashboardMessagesPage /> },
			{ path: "settings",       element: <DashboardSettingsPage /> },
			{ path: "new-tournament", element: <DashboardNewTournamentPage /> },
		],
	},

	/* QR code — layout autonome */
	{ path: "/tournament/:id", element: <PublicTournamentPage /> },

	/* Pages publiques — avec footer (après les routes spécifiques) */
	{
		element: <PublicLayout />,
		children: [
			{ index: true,        element: <HomePage /> },
			{ path: "/sports",    element: <SportsPage /> },
			{ path: "/tournaments", element: <TournamentsPage /> },
			{ path: "/teams",     element: <TeamsPage /> },
			{ path: "/organizers", element: <OrganizersPage /> },
			{ path: "/about",     element: <AboutPage /> },
			{ path: "/pricing",   element: <PricingPage /> },
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
