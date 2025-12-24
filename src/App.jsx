import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Cpu,
  Wifi,
  Lock,
  Database,
  Zap,
  Layers,
  Repeat,
  Trophy,
  LogOut,
  History,
  BookOpen,
  X,
  Crown,
  User,
  RotateCcw,
  Home,
  CheckCircle,
  Loader2,
  Server,
  Smartphone,
  Shield,
  AlertTriangle,
  Hammer,
  Sparkles,
  Trash2, // Added Trash2 icon
  Table, // For report card
  FileBarChart, // For report card
} from "lucide-react";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:97363172311f11c86aa637",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "neon-draft";
const GAME_ID = "10";

// --- Game Constants ---
const CARDS = {
  CACHE_1: {
    id: "CACHE_1",
    name: "Data Cache",
    val: 1,
    icon: Database,
    color: "text-blue-400",
    border: "border-blue-500",
    desc: "Worth 1 TB (Point).",
  },
  CACHE_2: {
    id: "CACHE_2",
    name: "Encrypted Cache",
    val: 2,
    icon: Database,
    color: "text-blue-300",
    border: "border-blue-400",
    desc: "Worth 2 TB (Points).",
  },
  CACHE_3: {
    id: "CACHE_3",
    name: "Root Access",
    val: 3,
    icon: Database,
    color: "text-blue-200",
    border: "border-blue-300",
    desc: "Worth 3 TB (Points).",
  },
  GPU: {
    id: "GPU",
    name: "GPU Cluster",
    val: 0,
    icon: Cpu,
    color: "text-orange-400",
    border: "border-orange-500",
    desc: "Pair = 5 TB. (2 GPUs = 5pts).",
  },
  KEY: {
    id: "KEY",
    name: "Encryption Key",
    val: 0,
    icon: Lock,
    color: "text-green-400",
    border: "border-green-500",
    desc: "Set Multiplier: 1/3/6/10/15 TB.",
  },
  BOTNET: {
    id: "BOTNET",
    name: "Botnet Node",
    val: 0,
    icon: Wifi,
    color: "text-red-400",
    border: "border-red-500",
    desc: "Majority = 6 TB. Minority = -3 TB.",
  },
  OVERCLOCK: {
    id: "OVERCLOCK",
    name: "Overclock",
    val: 0,
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-500",
    desc: "+1 TB for every GPU you have.",
  },
};

// Deck Template (Balanced for ~4-5 players)
const DECK_TEMPLATE = [
  ...Array(10).fill("CACHE_1"),
  ...Array(8).fill("CACHE_2"),
  ...Array(4).fill("CACHE_3"),
  ...Array(12).fill("GPU"),
  ...Array(12).fill("KEY"),
  ...Array(10).fill("BOTNET"),
  ...Array(6).fill("OVERCLOCK"),
];

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// --- Sub-Components ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full bg-cyan-500/5 mix-blend-overlay" />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "linear-gradient(rgba(18, 16, 99, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(18, 16, 99, 0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    ></div>
  </div>
);

const NeonLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-60 mt-auto pb-2 pt-2 relative z-10">
    <Layers size={12} className="text-cyan-400" />
    <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
      NEON DRAFT
    </span>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        Disconnect from Grid?
      </h3>
      <p className="text-slate-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Admin, leaving will shut down the server for all runners."
          : inGame
          ? "Leaving now will corrupt the data stream for everyone."
          : "Closing secure connection."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay Connected
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            <Home size={18} /> Reset to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-pink-600 hover:bg-pink-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Shut Down Server" : "Jack Out"}
        </button>
      </div>
    </div>
  </div>
);

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-0 md:p-4">
    <div className="bg-slate-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-slate-700 shadow-2xl">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-cyan-400" /> System Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"
        >
          <X className="text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/20 border-red-500 text-red-200"
                : log.type === "success"
                ? "bg-green-900/20 border-green-500 text-green-200"
                : "bg-slate-700/50 border-slate-500 text-slate-300"
            }`}
          >
            <span className="opacity-50 mr-2 font-mono">
              [
              {new Date(parseInt(log.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              ]
            </span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-slate-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-cyan-500/30 flex flex-col">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-cyan-400" /> Data Runner's Manual
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-slate-300 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">The Draft</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Select:</strong> Everyone picks 1 card from their hand
                simultaneously.
              </li>
              <li>
                <strong>Reveal:</strong> Kept cards are added to your "Rig"
                (Score Pile).
              </li>
              <li>
                <strong>Pass:</strong> The remaining hands are passed to the
                next player.
              </li>
              <li>Repeat until all cards are gone. 3 Rounds total.</li>
            </ul>
          </div>
          <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
            <h3 className="text-xl font-bold text-purple-400 mb-2">
              Scoring (TB)
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Cache:</strong> Flat points (1, 2, or 3).
              </li>
              <li>
                <strong>GPU:</strong> Pairs are worth 5 pts. (1 alone = 0).
              </li>
              <li>
                <strong>Keys:</strong> Set collection. 1=1, 2=3, 3=6, 4=10, 5=15
                pts.
              </li>
              <li>
                <strong>Botnet:</strong> Player with MOST = 6 pts. FEWEST = -3
                pts.
              </li>
              <li>
                <strong>Overclock:</strong> +1 pt for every GPU you have.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Feedback Overlay
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${
        type === "success" ? "bg-cyan-900/90 border-cyan-500 text-cyan-100" : ""
      }
      ${
        type === "info"
          ? "bg-purple-900/90 border-purple-500 text-purple-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

// Card Component
const Card = ({ typeId, onClick, selected, small }) => {
  const info = CARDS[typeId];
  if (!info) return null;
  const Icon = info.icon;

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-900 rounded-lg border-2 transition-all flex flex-col items-center justify-between
        ${info.border}
        ${
          selected
            ? "ring-4 ring-cyan-400 -translate-y-4 shadow-[0_0_20px_rgba(34,211,238,0.5)] z-20"
            : "hover:-translate-y-1 hover:shadow-lg"
        }
        ${onClick ? "cursor-pointer" : ""}
        ${small ? "w-16 h-24 p-1" : "w-24 h-36 md:w-32 md:h-48 p-2"}
      `}
    >
      <div className="w-full flex justify-between items-start">
        <span
          className={`font-black ${small ? "text-[10px]" : "text-sm"} ${
            info.color
          }`}
        >
          {info.val > 0 ? info.val : ""}
        </span>
        <div
          className={`${small ? "w-3 h-3" : "w-6 h-6"} rounded-full border ${
            info.border
          } bg-slate-800 flex items-center justify-center`}
        >
          <Icon size={small ? 8 : 14} className={info.color} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Icon
          size={small ? 20 : 40}
          className={`${info.color} drop-shadow-md`}
        />
        {!small && (
          <span
            className={`text-[10px] uppercase font-bold text-center leading-tight ${info.color}`}
          >
            {info.name}
          </span>
        )}
      </div>

      {!small && (
        <div className="w-full bg-black/40 rounded p-1 text-[8px] text-slate-400 text-center leading-tight">
          {info.desc}
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-cyan-500/20 rounded-lg flex items-center justify-center">
          <CheckCircle className="text-cyan-400 w-8 h-8 md:w-12 md:h-12 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function NeonDraftGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Session Restore ---
  useEffect(() => {
    const savedRoomId = localStorage.getItem("neondraft_roomId");
    if (savedRoomId) {
      setRoomId(savedRoomId);
      // Room sync effect will handle view switching
    }
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          // Kick Check: If player is not in the list, they have been removed
          if (
            !data.players ||
            !Array.isArray(data.players) ||
            !data.players.some((p) => p.id === user.uid)
          ) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("neondraft_roomId"); // Clear session
            setError("Connection Terminated (Kicked).");
            return;
          }

          setGameState(data);

          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // Feedback Trigger
          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            setFeedback(data.feedbackTrigger);
            setTimeout(() => setFeedback(null), 3000);
          }
        } else {
          // If doc is deleted (Host left), return to menu
          setRoomId("");
          setView("menu");
          localStorage.removeItem("neondraft_roomId"); // Clear session
          setError("Server shut down by Admin.");
        }
      }
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- Game Actions ---

  const createRoom = async () => {
    if (!playerName.trim()) return setError("Codename required.");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();

    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          hand: [],
          keptCards: [],
          score: 0,
          stats: { cache: 0, gpu: 0, key: 0, botnet: 0, overclock: 0 },
          ready: true,
          selection: null,
          history: [], // Keep track of past rounds
        },
      ],
      logs: [],
      round: 1,
      turnState: "IDLE", // SELECTING, RESOLVING
      feedbackTrigger: null,
      winner: null,
    };

    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData
      );
      localStorage.setItem("neondraft_roomId", newId); // Save session
      setRoomId(newId);
      setView("lobby");
    } catch (e) {
      setError("Network error.");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Code and Name required.");
    setLoading(true);
    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomCodeInput
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Room not found.");
      const data = snap.data();
      if (data.status !== "lobby") throw new Error("Draft in progress.");
      if (data.players.length >= 6) throw new Error("Server full.");

      if (!data.players.find((p) => p.id === user.uid)) {
        await updateDoc(ref, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            hand: [],
            keptCards: [],
            score: 0,
            stats: { cache: 0, gpu: 0, key: 0, botnet: 0, overclock: 0 },
            ready: true,
            selection: null,
            history: [],
          }),
        });
      }
      localStorage.setItem("neondraft_roomId", roomCodeInput); // Save session
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    // --- HOST LEAVE LOGIC: Delete room ---
    if (gameState.hostId === user.uid) {
      await deleteDoc(ref);
    } else {
      const updatedPlayers = gameState.players.filter((p) => p.id !== user.uid);
      await updateDoc(ref, { players: updatedPlayers });
    }

    localStorage.removeItem("neondraft_roomId"); // Clear session
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  // --- KICK FUNCTION ---
  const kickPlayer = async (playerIdToRemove) => {
    if (gameState.hostId !== user.uid) return;

    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers }
    );
  };

  // --- READY TOGGLE FUNCTION ---
  const toggleReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers }
    );
  };

  // --- Logic ---

  const startGame = async () => {
    if (gameState.players.length < 2) return setError("Need 2+ Runners.");

    // Create big deck
    let deck = shuffle([...DECK_TEMPLATE, ...DECK_TEMPLATE]);
    const players = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < 7; i++) hand.push(deck.pop());
      return {
        ...p,
        hand,
        keptCards: [],
        score: 0,
        stats: { cache: 0, gpu: 0, key: 0, botnet: 0, overclock: 0 },
        history: [], // Clear history for new game
        selection: null,
        ready: false, // Reset ready
      };
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: players,
        deck: deck,
        round: 1,
        turnState: "SELECTING",
        logs: [
          {
            id: Date.now().toString(),
            text: "Draft Initialized. Round 1.",
            type: "neutral",
          },
        ],
      }
    );
  };

  const selectCard = async (cardIdx) => {
    setSelectedCardIdx(cardIdx);
  };

  const confirmSelection = async () => {
    if (selectedCardIdx === null) return;

    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, selection: selectedCardIdx } : p
    );

    const allSelected = updatedPlayers.every((p) => p.selection !== null);

    if (allSelected) {
      await resolveTurn(updatedPlayers);
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
        }
      );
    }
    setSelectedCardIdx(null);
  };

  // Improved calculation to return full breakdown
  const calculateScoreBreakdown = (keptCards) => {
    let cache = 0;
    let gpuCount = 0;
    let keyCount = 0;
    let overclockCount = 0;
    let botnetCount = 0;

    keptCards.forEach((cId) => {
      const c = CARDS[cId];
      if (cId.startsWith("CACHE")) cache += c.val;
      if (cId === "GPU") gpuCount++;
      if (cId === "KEY") keyCount++;
      if (cId === "OVERCLOCK") overclockCount++;
      if (cId === "BOTNET") botnetCount++;
    });

    const gpuPoints = Math.floor(gpuCount / 2) * 5;
    const keyScores = [0, 1, 3, 6, 10, 15, 21, 28];
    const keyPoints = keyScores[Math.min(keyCount, 7)];
    const overclockPoints = overclockCount * gpuCount;

    return {
      total: cache + gpuPoints + keyPoints + overclockPoints, // Base score before botnet
      cache,
      gpu: gpuPoints,
      key: keyPoints,
      overclock: overclockPoints,
      botnetCount,
    };
  };

  const resolveTurn = async (currentPlayers) => {
    const logs = [];
    let nextState = "SELECTING";
    let nextRound = gameState.round;
    let feedback = null;
    let deck = [...(gameState.deck || [])];
    let status = "playing";
    let winner = null;

    // 1. Reveal & Move to Kept
    const players = currentPlayers.map((p) => {
      const card = p.hand[p.selection];
      const newHand = p.hand.filter((_, i) => i !== p.selection);
      return {
        ...p,
        hand: newHand,
        keptCards: [...p.keptCards, card],
        selection: null,
      };
    });

    logs.push({
      id: Date.now().toString(),
      text: "Data Fragments acquired. Passing hands...",
      type: "neutral",
    });

    // 2. Rotate Hands (Pass Left)
    const rotatedHands = players.map(
      (_, i) => players[(i + 1) % players.length].hand
    );
    players.forEach((p, i) => (p.hand = rotatedHands[i]));

    // 3. Check Round End
    if (players[0].hand.length === 0) {
      logs.push({
        id: Date.now() + 1,
        text: `Round ${gameState.round} Complete. Calculating Metrics...`,
        type: "success",
      });

      // SCORING LOGIC
      const breakdowns = players.map((p) =>
        calculateScoreBreakdown(p.keptCards)
      );

      // Resolve Botnets
      const maxBots = Math.max(...breakdowns.map((b) => b.botnetCount));
      const minBots = Math.min(...breakdowns.map((b) => b.botnetCount));

      players.forEach((p, i) => {
        const bd = breakdowns[i];
        let botnetPoints = 0;

        if (bd.botnetCount === maxBots && maxBots > 0) botnetPoints += 6;
        if (bd.botnetCount === minBots && players.length > 2) botnetPoints -= 3;

        const roundTotal = bd.total + botnetPoints;

        // Save round history
        p.history.push({
          round: gameState.round,
          cards: p.keptCards,
          score: roundTotal,
        });

        // Accumulate Stats
        p.stats.cache += bd.cache;
        p.stats.gpu += bd.gpu;
        p.stats.key += bd.key;
        p.stats.overclock += bd.overclock;
        p.stats.botnet += botnetPoints;

        p.score += roundTotal;
        p.keptCards = []; // Clear for next round
      });

      if (gameState.round >= 3) {
        status = "finished";
        const sorted = [...players].sort((a, b) => b.score - a.score);
        winner = sorted[0].name;
        feedback = {
          id: Date.now(),
          type: "success",
          message: "SYSTEM HACKED",
          subtext: `${winner} Dominates the Grid`,
        };
      } else {
        nextRound++;
        players.forEach((p) => {
          const newHand = [];
          for (let k = 0; k < 7; k++)
            if (deck.length > 0) newHand.push(deck.pop());
          p.hand = newHand;
        });
        feedback = {
          id: Date.now(),
          type: "info",
          message: `ROUND ${nextRound}`,
          subtext: "New Data Available",
        };
      }
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        turnState: nextState,
        round: nextRound,
        logs: arrayUnion(...logs),
        feedbackTrigger: feedback,
        deck,
        status,
        winner,
      }
    );
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      hand: [],
      keptCards: [],
      score: 0,
      stats: { cache: 0, gpu: 0, key: 0, botnet: 0, overclock: 0 },
      selection: null,
      history: [],
      ready: true,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        round: 1,
        winner: null,
        feedbackTrigger: null,
      }
    );
  };

  const me = gameState?.players.find((p) => p.id === user?.uid);

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            Grid Offline. Rerouting power to main servers.
          </p>
        </div>
        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  // --- Views ---

  if (!user)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 animate-pulse">
        Initializing Interface...
      </div>
    );

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Layers
            size={64}
            className="text-cyan-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 font-serif tracking-widest drop-shadow-md">
            NEON DRAFT
          </h1>
          <p className="text-cyan-600/60 tracking-[0.3em] uppercase mt-2">
            Build Your Rig. Rule the Net.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-slate-600 p-3 rounded mb-4 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors font-mono"
            placeholder="Hacker Alias"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
          >
            <Server size={20} /> New Server
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-slate-600 p-3 rounded text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:border-cyan-500 outline-none"
              placeholder="IP ADDR"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Connect
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> Data Manual
          </button>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-cyan-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            <h2 className="text-2xl font-serif text-cyan-400">
              Node: <span className="text-white font-mono">{roomId}</span>
            </h2>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-slate-800">
            <h3 className="text-slate-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Runners ({gameState.players.length})</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700/50"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${
                      p.id === user.uid ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    <User size={14} /> {p.name}{" "}
                    {p.id === gameState.hostId && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Online
                    </span>
                    {/* Trash Icon for Kick */}
                    {isHost && p.id !== user.uid && (
                      <button
                        onClick={() => kickPlayer(p.id)}
                        className="text-slate-500 hover:text-red-500 hover:bg-red-900/20 p-1 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {gameState.players.length < 2 && (
                <div className="text-center text-slate-500 italic text-sm py-2">
                  Waiting for connection...
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                gameState.players.length >= 2
                  ? "bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-900/20"
                  : "bg-slate-800 cursor-not-allowed text-slate-500"
              }`}
            >
              {gameState.players.length < 2
                ? "Waiting for Runners..."
                : "Initialize Draft"}
            </button>
          ) : (
            <div className="text-center text-cyan-400/60 animate-pulse font-serif italic">
              Waiting for Admin...
            </div>
          )}
        </div>
        <NeonLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isSelecting = gameState.turnState === "SELECTING";
    const hasSelected = me?.selection !== null;
    const waitingForOthers = isSelecting && hasSelected;
    const opponents = gameState.players.filter((p) => p.id !== user.uid);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {/* Overlays */}
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={feedback.type === "success" ? Trophy : Layers}
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            onConfirmLobby={() => {
              returnToLobby();
              setShowLeaveConfirm(false);
            }}
            inGame={true}
          />
        )}

        {/* Top Bar */}
        <div className="h-14 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-cyan-500 font-bold tracking-wider hidden md:block">
              NEON DRAFT
            </span>
            <span className="text-xs text-slate-500 bg-black/50 px-2 py-1 rounded">
              R{gameState.round}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-7xl mx-auto w-full gap-4">
          {/* Opponent Rigs (Top) - Increased Size */}
          <div className="w-full flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center">
            {opponents.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 p-2 rounded-lg border border-slate-700 min-w-[140px] flex flex-col gap-1"
              >
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-bold text-slate-300 truncate max-w-[80px]">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Trophy size={10} className="text-yellow-500" /> {p.score}
                  </div>
                </div>
                <div className="flex gap-0.5 justify-center bg-black/30 p-1 rounded">
                  {p.hand.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-3 bg-slate-600 rounded-sm"
                    ></div>
                  ))}
                </div>
                {p.selection !== null ? (
                  <div className="text-[10px] text-green-400 text-center font-bold flex items-center justify-center gap-1">
                    <CheckCircle size={10} /> Ready
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 text-center animate-pulse">
                    Thinking...
                  </div>
                )}
                {/* Larger Kept Cards Preview */}
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {p.keptCards.map((c, i) => {
                    const info = CARDS[c];
                    const Icon = info?.icon || Database;
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-md border border-slate-600 flex items-center justify-center ${info?.color
                          .replace("text", "bg")
                          .replace("400", "900")} bg-opacity-30`}
                      >
                        <Icon size={12} className={info?.color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* My Rig (Middle) */}
          <div className="flex-1 w-full bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 p-4 flex flex-col items-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 w-full text-center border-b border-slate-800 pb-2">
              My Data Rig -{" "}
              <span className="text-yellow-400 font-bold">{me.score} TB</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center content-start h-full overflow-y-auto w-full">
              {me.keptCards.length === 0 && (
                <div className="text-slate-600 italic mt-10">
                  System Empty. Acquire Data.
                </div>
              )}
              {me.keptCards.map((c, i) => (
                <Card key={i} typeId={c} small />
              ))}
            </div>
          </div>

          {/* Hand Selection (Bottom) */}
          <div
            className={`w-full max-w-4xl bg-slate-900/95 p-4 rounded-t-3xl border-t border-cyan-500/30 backdrop-blur-md mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 transition-all ${
              waitingForOthers ? "translate-y-4 opacity-90" : ""
            }`}
          >
            {gameState.status === "finished" ? (
              <div className="text-center py-6 w-full">
                <h3 className="text-4xl font-black text-cyan-400 mb-2">
                  {gameState.winner} Wins!
                </h3>
                <p className="text-slate-400 mb-6">Mission Debriefing</p>

                {/* --- VISUAL REPORT CARD --- */}
                <div className="w-full overflow-x-auto mb-8 px-2">
                  <div className="flex flex-col gap-4">
                    {gameState.players
                      .sort((a, b) => b.score - a.score)
                      .map((p) => {
                        // Aggregate cards for this player across all history
                        const allCards = p.history
                          ? p.history.flatMap((h) => h.cards)
                          : [];
                        // Group by type for cleaner display
                        const cardCounts = allCards.reduce((acc, cId) => {
                          acc[cId] = (acc[cId] || 0) + 1;
                          return acc;
                        }, {});

                        return (
                          <div
                            key={p.id}
                            className={`bg-slate-800/50 rounded-xl p-3 border ${
                              p.id === user.uid
                                ? "border-cyan-500/50 bg-cyan-900/20"
                                : "border-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-white flex items-center gap-2">
                                {p.name} {p.ready && "✅"}
                              </span>
                              <span className="text-xl font-black text-cyan-400">
                                {p.score} TB
                              </span>
                            </div>
                            {/* Card Visuals */}
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(cardCounts).map(
                                ([cId, count]) => {
                                  const info = CARDS[cId];
                                  const Icon = info.icon;
                                  return (
                                    <div
                                      key={cId}
                                      className={`flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border ${info.border}`}
                                    >
                                      <Icon size={12} className={info.color} />
                                      <span
                                        className={`text-xs font-bold ${info.color}`}
                                      >
                                        x{count}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Host Controls */}
                {gameState.hostId === user.uid ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={startGame}
                        disabled={!gameState.players.every((p) => p.ready)}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                      >
                        <RotateCcw size={18} /> Restart
                      </button>
                      <button
                        onClick={returnToLobby}
                        disabled={!gameState.players.every((p) => p.ready)}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                      >
                        <Home size={18} /> Lobby
                      </button>
                    </div>
                    {!gameState.players.every((p) => p.ready) && (
                      <span className="text-xs text-slate-500 animate-pulse">
                        Waiting for all runners to mark ready...
                      </span>
                    )}
                    {/* Host Ready Toggle */}
                    {!me.ready && (
                      <button
                        onClick={toggleReady}
                        className="text-cyan-400 text-sm hover:text-cyan-300 underline"
                      >
                        Mark Self Ready
                      </button>
                    )}
                  </div>
                ) : (
                  /* Guest Controls */
                  <div className="w-full max-w-sm mx-auto">
                    <button
                      onClick={toggleReady}
                      className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all mb-2 ${
                        me.ready
                          ? "bg-green-600/20 border border-green-500 text-green-400 cursor-default"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white"
                      }`}
                    >
                      {me.ready ? "READY - STANDING BY" : "MARK READY"}
                    </button>
                    <div className="text-slate-500 text-xs italic">
                      Waiting for Host command...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Smartphone size={18} className="text-cyan-400" /> Incoming
                    Stream ({me.hand.length})
                  </h3>
                  {waitingForOthers && (
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold animate-pulse">
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Synchronizing...
                    </div>
                  )}
                </div>

                {/* Cards Scroller */}
                <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 pt-4 px-2 justify-start md:justify-center min-h-[160px] md:min-h-[220px]">
                  {me.hand.map((c, i) => (
                    <div
                      key={i}
                      className={`transition-all duration-300 ${
                        waitingForOthers
                          ? "grayscale opacity-50 pointer-events-none scale-90"
                          : ""
                      }`}
                    >
                      <Card
                        typeId={c}
                        onClick={() => selectCard(i)}
                        selected={selectedCardIdx === i}
                      />
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={confirmSelection}
                  disabled={selectedCardIdx === null || waitingForOthers}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all mt-2
                                    ${
                                      waitingForOthers
                                        ? "bg-slate-800 text-cyan-400/50 cursor-wait border border-slate-700"
                                        : selectedCardIdx !== null
                                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50"
                                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    }`}
                >
                  {waitingForOthers
                    ? "Waiting for other runners..."
                    : selectedCardIdx !== null
                    ? "ACQUIRE DATA"
                    : "Select a Fragment"}
                </button>
              </>
            )}
          </div>
        </div>
        <NeonLogo />
      </div>
    );
  }

  return null;
}
