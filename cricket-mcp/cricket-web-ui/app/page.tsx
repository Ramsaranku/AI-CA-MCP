"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
              🏏
            </div>
            <h1 className="text-xl font-bold tracking-wide">Cricket AI</h1>
          </div>
          
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">
              Dashboard
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 transition">
              Live Matches
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 transition">
              Player Stats
            </button>
          </nav>
        </div>
        
        <div className="text-xs text-slate-500">
          MCP Engine v1.0
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-slate-200">Match Analytics & Assistant</h2>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
            System Ready
          </span>
        </header>

        {/* Dashboard Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Series</span>
              <p className="text-2xl font-bold mt-1 text-slate-100">T20 World Cup</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-semibold">Tracked Players</span>
              <p className="text-2xl font-bold mt-1 text-slate-100">128</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-semibold">MCP Tools</span>
              <p className="text-2xl font-bold mt-1 text-emerald-400">Connected</p>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl h-[420px] flex flex-col">
            <div className="p-4 border-b border-slate-800 font-medium text-sm text-slate-300">
              AI Match Assistant
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-slate-800/60 max-w-md p-3 rounded-lg text-sm text-slate-300">
                Ask me for live scores, player statistics, or match predictions.
              </div>
            </div>
            
            {/* Input Bar */}
            <form onSubmit={(e) => e.preventDefault()} className="p-4 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about cricket scores or player stats..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}