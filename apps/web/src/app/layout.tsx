"use client";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import "./globals.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [activeProjectName, setActiveProjectName] = useState("");

  const projectId = pathname?.startsWith("/projects/") ? pathname.split("/")[2] : null;
  const currentTab = searchParams?.get("tab") || "list";

  useEffect(() => {
    const syncUser = () => {
      const userStr = localStorage.getItem("user");
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    syncUser();
    window.addEventListener("openzupu-auth-change", syncUser);
    return () => window.removeEventListener("openzupu-auth-change", syncUser);
  }, []);

  useEffect(() => {
    const handleProjectActive = (e: any) => {
      if (e.detail) {
        setActiveProjectName(e.detail);
      }
    };
    window.addEventListener("openzupu-project-active", handleProjectActive);
    const saved = localStorage.getItem("active_project_name");
    if (saved) {
      setActiveProjectName(saved);
    }
    return () => window.removeEventListener("openzupu-project-active", handleProjectActive);
  }, []);

  const handleSignOut = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("active_project_name");
    setActiveProjectName("");
    router.push("/login");
  };
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "list": return t("personListTab");
      case "tree": return t("familyTreeTab");
      case "stats": return language === "zh" ? "数据统计" : "Statistics";
      case "migration": return language === "zh" ? "时空轨迹" : "Migration";
      case "members": return t("membersTab");
      case "tools": return t("dataToolsTab");
      case "sources": return t("sourcesTitle");
      case "generations": return t("generationPoemTab");
      case "map": return t("migrationMapTab");
      default: return "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-blue-600 font-serif">
              {t("openZupu")}
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">
              v1.9
            </span>
          </div>

          {/* Breadcrumb Path for optimized hierarchy */}
          {projectId && (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                {language === "zh" ? "所有谱书" : "Pedigree Books"}
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-600 max-w-[180px] truncate font-serif">
                {activeProjectName || "Loading..."}
              </span>
              <span>/</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {getTabLabel(currentTab)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 rounded px-2.5 py-1 bg-slate-50 transition-colors"
          >
            <span>🌐</span>
            <span>{language === "zh" ? "English" : "简体中文"}</span>
          </button>

          {/* User Sign Out */}
          {user && (
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
              <span className="text-sm font-medium text-slate-700 font-sans">
                {user.username} ({user.role})
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:border-red-300 rounded px-2 py-1 bg-red-50 transition-colors"
              >
                {t("signOut")}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Dynamic Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block print:hidden">
          {projectId && (
            <div className="mb-5 p-3 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-sm">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">
                {language === "zh" ? "当前修编谱书" : "Active Pedigree"}
              </span>
              <h4 className="font-serif font-bold text-sm truncate" title={activeProjectName}>
                {activeProjectName || "Loading..."}
              </h4>
            </div>
          )}

          <nav className="space-y-6">
            {/* Project Context Sidebar Links */}
            {projectId && (
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  {language === "zh" ? "谱书控制台" : "PEDIGREE CONSOLE"}
                </span>
                
                <Link
                  href={`/projects/${projectId}?tab=list`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "list"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>📂</span> {t("personListTab")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=tree`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "tree"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>🌿</span> {t("familyTreeTab")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=stats`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "stats"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>📊</span> {language === "zh" ? "数据统计" : "Statistics"}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=migration`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "migration"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>🗺️</span> {language === "zh" ? "时空轨迹" : "Migration"}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=sources`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "sources"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>📜</span> {t("sourcesTitle")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=generations`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "generations"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>📖</span> {t("generationPoemTab")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=map`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "map"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>🗺️</span> {t("migrationMapTab")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=members`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "members"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>👥</span> {t("membersTab")}
                </Link>

                <Link
                  href={`/projects/${projectId}?tab=tools`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    currentTab === "tools"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-650 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>🛠️</span> {t("dataToolsTab")}
                </Link>
              </div>
            )}

            {/* Global Settings / Actions */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                {language === "zh" ? "系统全局" : "SYSTEM GLOBAL"}
              </span>
              
              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  !projectId && pathname === "/"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-650 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span>📂</span> {t("projects")}
              </Link>
              
              <Link
                href="/settings"
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  pathname === "/settings"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-650 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span>⚙️</span> {t("settings")}
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full print:p-0 print:m-0">
          {children}
        </main>
      </div>
    </div>
  );
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <LanguageProvider>
          <Suspense fallback={<div className="p-8 text-center text-slate-500 font-serif">加载中... / Loading...</div>}>
            <LayoutContent>{children}</LayoutContent>
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
