"use client";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import "./globals.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight text-blue-600">
            {t("openZupu")}
          </span>
          <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">
            v1.3
          </span>
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
              <span className="text-sm font-medium text-slate-700">
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
        <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block">
          <nav className="space-y-2">
            <a
              href="/"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
            >
              📂 {t("projects")}
            </a>
            <a
              href="/settings"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
            >
              ⚙️ {t("settings")}
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
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
          <LayoutContent>{children}</LayoutContent>
        </LanguageProvider>
      </body>
    </html>
  );
}
