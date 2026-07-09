"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, setAuthSession } from "@/lib/api";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const loginAsDemoGuest = async () => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "guest", password: "editor123" }),
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
      if (res.status === 401) {
        await loginAsDemoGuest();
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {isCreating ? "Cancel" : "New Project"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-medium">Create New Project</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input 
              type="text" 
              required 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
            Save Project
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
            Loading demo projects...
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-red-600 bg-white rounded-lg border border-red-200">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
            No projects found. Create one to get started.
          </div>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block group">
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                <p className="text-slate-500 text-sm mt-2 flex-1">{p.description || "No description provided."}</p>
                <div className="text-xs text-slate-400 mt-4 flex justify-between">
                  <span>Updated: {new Date(p.updatedAt).toLocaleDateString()}</span>
                  <span>{p.projectType}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
