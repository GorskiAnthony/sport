import Button from "./Button";

function Navbar() {
	return (
		<nav className="flex justify-between items-center p-4 bg-[#0D1117] text-white">
			<img src="logo_white.png" alt="Logo" className="h-24 w-24" />
			<div className="flex space-x-4 text-[#94A3B8] ">
				<a href="!#" className="hover:text-white">
					Tournois
				</a>
				<a href="!#" className="hover:text-white">
					Équipes
				</a>
				<a href="!#" className="hover:text-white">
					Organisateur
				</a>
				<a href="!#" className="hover:text-white">
					À propos
				</a>
				<a href="!#" className="hover:text-white">
					Tarif
				</a>
			</div>
			<div className="flex space-x-4">
				<Button text="Se connecter" />
				<Button text="Créer un compte" primary />
			</div>
		</nav>
	);
}

export default Navbar;
