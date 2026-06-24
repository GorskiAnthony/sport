import { Navigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import CommunitySection from "../components/CommunitySection";
import StatsSection from "../components/StatsSection";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
	const { user, loading } = useAuth();

	if (loading) return null;
	if (user?.role === "organisateur") return <Navigate to="/dashboard" replace />;
	if (user?.role === "spectateur")   return <Navigate to="/accueil"   replace />;

	return (
		<main id="main-content" className="flex-1">
			<HeroSection />
			<FeaturesSection />
			<CommunitySection />
			<StatsSection />
		</main>
	);
}

export default HomePage;
