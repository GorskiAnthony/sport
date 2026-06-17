function Button({ text, primary }) {
	return (
		<button
			className={
				primary
					? "bg-[#22C55E] hover:bg-[#16A085] text-black py-2 px-4 rounded"
					: "text-[#94A3B8] py-2 px-4 rounded stroke-0 hover:text-white hover:bg-[#161B22] border border-[#94A3B8]"
			}
		>
			{text}
		</button>
	);
}

export default Button;
