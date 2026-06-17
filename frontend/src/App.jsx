import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function App() {
	return (
		<section className="bg-[#0D1117] text-white min-h-screen flex flex-col">
			<Navbar />
			<h1>Je suis le composant : `application`</h1>
			<Footer />
		</section>
	);
}

export default App;
