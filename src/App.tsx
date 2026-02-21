import React, { useState, useEffect, useMemo } from "react";
import mqtt from "mqtt";
import { Calendar, User, Check, Users, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoteRecord {
  username: string;
  dates: string[];
}

const AVAILABLE_DATES = [
  "2月23日",
  "2月24日",
  "2月25日",
  "2月26日",
  "2月27日"
];

const TOPIC_PREFIX = "dream-vote-app-v1-20260220/votes";

export default function App() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [username, setUsername] = useState(() => localStorage.getItem("vote_username") || "");
  const [isEditingName, setIsEditingName] = useState(!username);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [allVotesMap, setAllVotesMap] = useState<Record<string, string[]>>({});
  const [tempName, setTempName] = useState(username);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // Connect to a free, public MQTT broker over secure WebSockets
    const mqttClient = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

    mqttClient.on("connect", () => {
      console.log("Connected to public MQTT broker");
      // Subscribe to all votes
      mqttClient.subscribe(`${TOPIC_PREFIX}/+`);
    });

    mqttClient.on("message", (topic, message) => {
      const msgUsername = topic.split("/").pop();
      if (msgUsername) {
        try {
          const dates = JSON.parse(message.toString());
          setAllVotesMap(prev => ({ ...prev, [msgUsername]: dates }));
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      }
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  // Sync initial dates when user connects and their data arrives
  useEffect(() => {
    if (username && allVotesMap[username] && !hasSynced) {
      setSelectedDates(allVotesMap[username]);
      setHasSynced(true);
    }
  }, [allVotesMap, username, hasSynced]);

  const allVotes = useMemo(() => {
    return Object.entries(allVotesMap).map(([u, dates]) => ({
      username: u,
      dates
    }));
  }, [allVotesMap]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      const newName = tempName.trim();
      setUsername(newName);
      localStorage.setItem("vote_username", newName);
      setIsEditingName(false);
      
      if (allVotesMap[newName]) {
        setSelectedDates(allVotesMap[newName]);
      } else {
        setSelectedDates([]);
      }
      setHasSynced(true);
    }
  };

  const toggleDate = (date: string) => {
    const newDates = selectedDates.includes(date)
      ? selectedDates.filter(d => d !== date)
      : [...selectedDates, date];
    
    setSelectedDates(newDates);
    
    if (client && username) {
      // Publish with retain: true so late joiners can see the votes
      client.publish(`${TOPIC_PREFIX}/${username}`, JSON.stringify(newDates), { retain: true });
    }
  };

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    AVAILABLE_DATES.forEach(d => counts[d] = 0);
    allVotes.forEach(vote => {
      vote.dates.forEach(date => {
        if (counts[date] !== undefined) counts[date]++;
      });
    });
    return counts;
  }, [allVotes]);

  const totalVoters = allVotes.length;

  return (
    <div className="min-h-screen relative overflow-hidden font-sans pb-20">
      {/* Vaporwave Background Elements */}
      <div className="vapor-grid" />
      <div className="vapor-sun" />
      <div className="vapor-grain" />

      <div className="max-w-md mx-auto px-4 pt-12 space-y-10 relative z-10">
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-display text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-vapor-cyan via-vapor-pink to-vapor-purple drop-shadow-[0_5px_15px_rgba(0,245,212,0.5)]">
              DREAM VOTE
            </h1>
            <p className="font-display text-xl font-bold text-vapor-pink tracking-[0.2em] uppercase opacity-80 mt-2">
              谁 没 空 ？
            </p>
          </motion.div>
          <div className="flex justify-center gap-4">
            <span className="h-[2px] w-12 bg-vapor-cyan shadow-[0_0_10px_#00f5d4]" />
            <Sparkles className="text-vapor-cyan animate-pulse" size={20} />
            <span className="h-[2px] w-12 bg-vapor-cyan shadow-[0_0_10px_#00f5d4]" />
          </div>
        </header>

        {/* Identity Section */}
        <section className="glass-card p-6 border-vapor-purple/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-vapor-cyan">
              <User size={20} className="drop-shadow-[0_0_5px_#00f5d4]" />
              <span className="font-display font-bold uppercase tracking-widest text-sm">User ID</span>
            </div>
            {!isEditingName && (
              <button 
                onClick={() => {
                  setTempName(username);
                  setIsEditingName(true);
                }}
                className="text-xs font-bold text-vapor-pink hover:text-white transition-colors uppercase tracking-wider"
              >
                [ Edit ]
              </button>
            )}
          </div>

          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className="flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="ENTER NAME..."
                className="flex-1 bg-black/40 border border-vapor-purple/50 rounded-xl px-4 py-3 text-vapor-cyan placeholder:text-vapor-purple/40 outline-none focus:border-vapor-cyan transition-all font-display font-bold uppercase"
                autoFocus
              />
              <button 
                type="submit"
                className="bg-vapor-purple text-vapor-dark px-6 py-3 rounded-xl font-black uppercase tracking-tighter hover:bg-vapor-pink transition-all shadow-[0_0_20px_rgba(157,141,241,0.4)]"
              >
                GO
              </button>
            </form>
          ) : (
            <div className="text-3xl font-black text-white italic tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {username}
            </div>
          )}
        </section>

        {/* Date Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-vapor-pink px-1">
            <Calendar size={20} className="drop-shadow-[0_0_5px_#ff85a1]" />
            <span className="font-display font-bold uppercase tracking-widest text-sm">Select Busy Dates</span>
          </div>
          
          <div className="grid gap-4">
            {AVAILABLE_DATES.map((date, idx) => {
              const isSelected = selectedDates.includes(date);
              return (
                <motion.button
                  key={date}
                  initial={{ x: idx % 2 === 0 ? -20 : 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isEditingName && toggleDate(date)}
                  disabled={isEditingName}
                  className={`
                    relative group flex items-center justify-between p-5 rounded-2xl border-2 transition-all overflow-hidden
                    ${isSelected 
                      ? "bg-vapor-pink/20 border-vapor-pink text-white shadow-[0_0_30px_rgba(255,133,161,0.3)]" 
                      : "bg-black/30 border-vapor-purple/30 text-vapor-purple hover:border-vapor-cyan/50"}
                    ${isEditingName ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {/* Scanline effect for selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-[scanline_2s_linear_infinite]" />
                  )}
                  
                  <span className="font-display font-black text-2xl italic tracking-tighter">{date}</span>
                  <div className={`
                    w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all
                    ${isSelected ? "bg-vapor-pink border-vapor-pink text-vapor-dark rotate-12" : "border-vapor-purple/50 group-hover:border-vapor-cyan"}
                  `}>
                    {isSelected && <Check size={18} strokeWidth={4} />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="glass-card p-8 border-vapor-cyan/30 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-vapor-cyan">
              <Users size={20} className="drop-shadow-[0_0_5px_#00f5d4]" />
              <span className="font-display font-bold uppercase tracking-widest text-sm">Live Feed</span>
            </div>
            <div className="font-display font-black text-xs bg-vapor-cyan/20 px-3 py-1 rounded-full text-vapor-cyan border border-vapor-cyan/30">
              {totalVoters} USERS
            </div>
          </div>

          <div className="space-y-6">
            {AVAILABLE_DATES.map((date) => {
              const count = summary[date] || 0;
              const percentage = totalVoters > 0 ? (count / totalVoters) * 100 : 0;
              
              return (
                <div key={date} className="space-y-2">
                  <div className="flex justify-between font-display font-bold text-sm italic">
                    <span className="text-white tracking-widest">{date}</span>
                    <span className="text-vapor-pink">
                      {count} BUSY
                    </span>
                  </div>
                  <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-gradient-to-r from-vapor-purple via-vapor-pink to-vapor-cyan shadow-[0_0_15px_rgba(0,245,212,0.5)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voter List */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <p className="font-display text-[10px] text-vapor-purple font-black uppercase tracking-[0.3em]">Transmission Logs</p>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {allVotes.length === 0 ? (
                <p className="font-display text-sm text-vapor-purple/40 italic">Waiting for signal...</p>
              ) : (
                allVotes.map((vote) => (
                  <div key={vote.username} className="glass-card p-3 border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-vapor-cyan" />
                      <span className="font-display font-black text-white italic text-sm">{vote.username}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vote.dates.length === 0 ? (
                        <span className="text-[10px] font-bold text-vapor-cyan/50 uppercase tracking-widest">Status: Clear</span>
                      ) : (
                        vote.dates.map(d => (
                          <span key={d} className="bg-vapor-purple/20 text-vapor-purple text-[9px] font-black px-2 py-0.5 rounded border border-vapor-purple/30 uppercase italic">
                            {d}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <footer className="text-center opacity-30 pt-10">
          <p className="font-display text-[10px] tracking-[0.5em] uppercase">Retro Future Systems v1.0</p>
        </footer>
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9d8df1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
