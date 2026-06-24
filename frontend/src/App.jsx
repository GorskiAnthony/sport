import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import CommunitySection from "./components/CommunitySection";
import StatsSection from "./components/StatsSection";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import AddTeamPage from "./pages/AddTeamPage";
import TournoisPage from "./pages/TournoisPage";
import EquipesPage from "./pages/EquipesPage";
import OrganisateursPage from "./pages/OrganisateursPage";
import AProposPage from "./pages/AProposPage";
import TarifsPage from "./pages/TarifsPage";
import NotFoundPage from "./pages/NotFoundPage";

function HomePage() {
	return (
		<main id="main-content" className="flex-1">
			<HeroSection />
			<FeaturesSection />
			<CommunitySection />
			<StatsSection />
		</main>
	);
}

function Layout({ children, hideFooter = false }) {
	return (
		<div className="bg-[#0D1117] text-white min-h-screen flex flex-col">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-green-500 focus:text-black focus:px-4 focus:py-2 focus:rounded font-semibold"
			>
				Aller au contenu principal
			</a>
			<Navbar />
			{children}
			{!hideFooter && <Footer />}
		</div>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public */}
				<Route path="/" element={<Layout><HomePage /></Layout>} />
				<Route path="/tournois" element={<Layout><TournoisPage /></Layout>} />
				<Route path="/equipes" element={<Layout><EquipesPage /></Layout>} />
				<Route path="/organisateurs" element={<Layout><OrganisateursPage /></Layout>} />
				<Route path="/a-propos" element={<Layout><AProposPage /></Layout>} />
				<Route path="/tarifs" element={<Layout><TarifsPage /></Layout>} />

				{/* Auth */}
				<Route path="/connexion" element={<Layout hideFooter><LoginPage /></Layout>} />
				<Route path="/inscription" element={<Layout hideFooter><RegisterPage /></Layout>} />
				<Route path="/inscription/tournoi" element={<Layout hideFooter><CreateTournamentPage /></Layout>} />
				<Route path="/inscription/equipes" element={<Layout hideFooter><AddTeamPage /></Layout>} />

				{/* 404 */}
				<Route path="*" element={<Layout><NotFoundPage /></Layout>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
