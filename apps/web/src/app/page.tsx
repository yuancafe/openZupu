"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, clearAuthSession, setAuthSession } from "@/lib/api";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const loginAsDemoUser = async () => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    if (!res.ok) {
      throw new Error("Demo login failed");
    }
    setAuthSession(await res.json());
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    setError("");
    try {
      let res = await apiFetch("/projects", { skipAuthRedirect: true });
      if (!res.ok) {
        clearAuthSession();
        await loginAsDemoUser();
        res = await apiFetch("/projects", { skipAuthRedirect: true });
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch projects: ${res.status}`);
      }
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Could not load demo projects. Please try signing in again.");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          projectType: "FAMILY",
          defaultPrivacy: "PRIVATE",
        }),
      });
      setIsCreating(false);
      setNewProjectName("");
      setNewProjectDesc("");
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">
            📜 {projects.length > 0 ? "Digital Pedigree Repositories" : "Start Your Genealogy"}
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Manage your family lineage, track Y-DNA/mtDNA markers, and run federated matching with other clan databases.
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
        >
          {isCreating ? "✕ Cancel" : "＋ New Pedigree Book"}
        </button>
      </div>

      {/* Glassmorphic Project Creation Form */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-lg space-y-4 animate-slide-up">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🏮 Create New Pedigree Repository
            </h3>
            <p className="text-xs text-slate-500">Provide details to initialize a separate database branch.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Pedigree Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g., Zhang Clan Genealogy - Jiangnan Branch"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-slate-800 transition-all text-sm outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Description & Origin Notes</label>
              <textarea 
                placeholder="Describe the migration origin, branch founder, or compiler info..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-slate-800 transition-all text-sm outline-none resize-none" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md"
            >
              Create Repository
            </button>
          </div>
        </form>
      )}

      {/* Grid of Pedigree Repositories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-amber-600 mb-3"></div>
            <p className="text-sm">Accessing genealogy databases...</p>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-rose-600 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold mt-2">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">📜</span>
            <p className="font-medium text-slate-600">No Pedigree books initialized yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click &ldquo;New Project&rdquo; on the top right to start compiling.</p>
          </div>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block group">
              <div className="bg-white border border-slate-100 hover:border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-xl group-hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                {/* Decorative border top style matching the project type */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-600"></div>
                
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                    📜 {p.projectType === "FAMILY" ? "Clan" : p.projectType}
                  </span>
                </div>

                <p className="text-slate-500 text-sm mt-1 flex-1 line-clamp-3 leading-relaxed">
                  {p.description || "No description compiled yet. Enter edit mode inside the project view to write origins."}
                </p>

                <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    📅 Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="text-amber-700 font-bold group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                    Explore &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
