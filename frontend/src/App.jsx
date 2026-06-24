import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import CommunitySection from "./components/CommunitySection";
import StatsSection from "./components/StatsSection";
import Footer from "./components/Footer";

function App() {
	return (
		<div className="bg-[#0D1117] text-white min-h-screen flex flex-col">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-green-500 focus:text-black focus:px-4 focus:py-2 focus:rounded font-semibold"
			>
				Aller au contenu principal
			</a>

			<Navbar />

			<main id="main-content" className="flex-1">
				<HeroSection />
				<FeaturesSection />
				<CommunitySection />
				<StatsSection />
			</main>

			<Footer />
		</div>
	);
}

export default App;
