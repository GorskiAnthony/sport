import { useState, useEffect, useContext } from "react";
import BreadcrumbContext from "../../contexts/BreadcrumbContext";

const MOCK_CONVERSATIONS = [
	{
		id: 1,
		from: "Fédération Française de Football",
		initials: "FFF",
		color: "bg-blue-600",
		subject: "Validation du tournoi Challenge U15",
		preview: "Votre demande de validation a bien été reçue. Nous reviendrons vers vous sous 48h.",
		time: "Aujourd'hui, 10:42",
		unread: true,
		messages: [
			{ id: 1, from: "FFF", text: "Bonjour, nous avons bien reçu votre demande de validation pour le tournoi Challenge U15. Nous reviendrons vers vous sous 48h.", time: "10:42" },
		],
	},
	{
		id: 2,
		from: "FC Lyon",
		initials: "FCL",
		color: "bg-sky-500",
		subject: "Confirmation d'inscription",
		preview: "Nous confirmons l'inscription de nos 16 joueurs pour le tournoi du 24 Mai.",
		time: "Hier, 18:15",
		unread: true,
		messages: [
			{ id: 1, from: "FCL", text: "Bonjour, nous confirmons l'inscription de nos 16 joueurs pour le tournoi du 24 Mai. Merci de bien vouloir confirmer la réception.", time: "18:15" },
		],
	},
	{
		id: 3,
		from: "AS Monaco",
		initials: "ASM",
		color: "bg-red-600",
		subject: "Changement d'horaire demandé",
		preview: "Serait-il possible de décaler notre premier match à 15h au lieu de 14h ?",
		time: "22 Mai",
		unread: false,
		messages: [
			{ id: 1, from: "ASM", text: "Bonjour, serait-il possible de décaler notre premier match à 15h au lieu de 14h ? Nous avons un problème de transport.", time: "09:30" },
			{ id: 2, from: "Vous", text: "Bonjour, malheureusement les horaires sont déjà fixés. Je vous invite à contacter directement l'organisateur logistique.", time: "11:00" },
		],
	},
	{
		id: 4,
		from: "Stade Rennais",
		initials: "SR",
		color: "bg-slate-600",
		subject: "Liste des joueurs",
		preview: "Veuillez trouver ci-joint la liste officielle de nos joueurs pour le tournoi.",
		time: "20 Mai",
		unread: false,
		messages: [
			{ id: 1, from: "SR", text: "Bonjour, veuillez trouver la liste officielle de nos joueurs pour le tournoi. Effectif complet, 16 joueurs, tous licenciés.", time: "14:22" },
		],
	},
];

function ConversationItem({ conv, isActive, onClick }) {
	return (
		<button
			onClick={onClick}
			className={`w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
				isActive ? "bg-green-500/10 border-l-2 border-l-green-500" : ""
			}`}
		>
			<div className="flex items-start gap-3">
				<div className={`w-9 h-9 rounded-full ${conv.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
					{conv.initials}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-0.5">
						<p className={`text-xs font-semibold truncate ${conv.unread ? "text-white" : "text-slate-300"}`}>
							{conv.from}
						</p>
						<span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{conv.time}</span>
					</div>
					<p className={`text-xs truncate ${conv.unread ? "text-slate-300" : "text-slate-500"}`}>
						{conv.subject}
					</p>
					<p className="text-[11px] text-slate-600 truncate mt-0.5">{conv.preview}</p>
				</div>
				{conv.unread && (
					<span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1" aria-label="Non lu" />
				)}
			</div>
		</button>
	);
}

function MessageBubble({ msg }) {
	const isMe = msg.from === "Vous";
	return (
		<div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
			<div className={`max-w-[70%] px-4 py-2.5 rounded-xl text-sm ${
				isMe
					? "bg-green-500/20 text-green-100 rounded-br-sm"
					: "bg-white/5 text-slate-200 rounded-bl-sm"
			}`}>
				<p>{msg.text}</p>
				<p className="text-[10px] text-slate-500 mt-1 text-right">{msg.time}</p>
			</div>
		</div>
	);
}

function MessagesPage() {
	const ctx = useContext(BreadcrumbContext);
	const [convs, setConvs] = useState(MOCK_CONVERSATIONS);
	const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id);
	const [draft, setDraft] = useState("");

	useEffect(() => {
		ctx?.setCrumbs([{ label: "Messages" }]);
	}, []);

	const active = convs.find((c) => c.id === activeId);
	const unreadCount = convs.filter((c) => c.unread).length;

	const handleSelect = (id) => {
		setActiveId(id);
		setConvs((prev) => prev.map((c) => c.id === id ? { ...c, unread: false } : c));
	};

	const handleSend = () => {
		if (!draft.trim()) return;
		setConvs((prev) => prev.map((c) =>
			c.id === activeId
				? { ...c, messages: [...c.messages, { id: Date.now(), from: "Vous", text: draft.trim(), time: "À l'instant" }] }
				: c
		));
		setDraft("");
	};

	return (
		<div className="max-w-5xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<h1 className="text-white text-2xl font-extrabold">Messages</h1>
					{unreadCount > 0 && (
						<span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full border border-green-500/30">
							{unreadCount} non lu{unreadCount > 1 ? "s" : ""}
						</span>
					)}
				</div>
				<button className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500">
					+ Nouveau message
				</button>
			</div>

			<div className="bg-[#161B22] border border-white/5 rounded-xl overflow-hidden flex" style={{ height: "520px" }}>
				{/* Conversation list */}
				<aside className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden" aria-label="Conversations">
					<div className="px-4 py-3 border-b border-white/5">
						<input
							type="search"
							placeholder="Rechercher…"
							className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-green-500/40 transition-colors"
						/>
					</div>
					<div className="flex-1 overflow-y-auto">
						{convs.map((conv) => (
							<ConversationItem
								key={conv.id}
								conv={conv}
								isActive={conv.id === activeId}
								onClick={() => handleSelect(conv.id)}
							/>
						))}
					</div>
				</aside>

				{/* Message thread */}
				{active && (
					<div className="flex-1 flex flex-col overflow-hidden">
						{/* Thread header */}
						<div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-3">
							<div className={`w-8 h-8 rounded-full ${active.color} flex items-center justify-center text-white text-xs font-bold`}>
								{active.initials}
							</div>
							<div>
								<p className="text-white text-sm font-semibold">{active.from}</p>
								<p className="text-slate-500 text-xs">{active.subject}</p>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
							{active.messages.map((msg) => (
								<MessageBubble key={msg.id} msg={msg} />
							))}
						</div>

						{/* Compose */}
						<div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
							<input
								type="text"
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								placeholder="Écrire un message…"
								className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/40 transition-colors"
							/>
							<button
								onClick={handleSend}
								disabled={!draft.trim()}
								className="flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-400 disabled:bg-white/5 disabled:text-slate-600 text-black rounded-lg transition-colors"
								aria-label="Envoyer"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
								</svg>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default MessagesPage;
