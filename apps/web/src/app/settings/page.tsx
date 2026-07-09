"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { apiFetch, clearAuthSession } from "@/lib/api";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Create User Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [msg, setMsg] = useState({ text: "", isError: false });

  const fetchUsers = () => {
    apiFetch("/users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching users:", err));
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setCurrentUser(parsed);
      if (parsed.role === "ADMIN") {
        fetchUsers();
      }
    }
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    window.location.href = "/login";
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", isError: false });
    try {
      const res = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ username, email, password, role }),
      });
      if (res.ok) {
        setMsg({ text: t("success"), isError: false });
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("USER");
        fetchUsers();
      } else {
        const data = await res.json();
        setMsg({ text: data.message || t("error"), isError: true });
      }
    } catch (err) {
      setMsg({ text: t("error"), isError: true });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Cannot delete your own administrator account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user account?")) return;

    try {
      const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t("systemSettings")}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Configure system options, language preferences, and manage users.
        </p>
      </div>

      {/* Session and Language Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Section */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold border-b border-slate-100 pb-2 flex items-center gap-2">
            🌐 {t("languageSettingLabel")}
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage("zh")}
              className={`px-4 py-2 border rounded-md font-medium text-sm transition-all ${
                language === "zh"
                  ? "bg-blue-600 border-blue-600 text-white shadow"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              简体中文 (Chinese)
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 border rounded-md font-medium text-sm transition-all ${
                language === "en"
                  ? "bg-blue-600 border-blue-600 text-white shadow"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              English (English)
            </button>
          </div>
        </section>

        {/* Current Session */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold border-b border-slate-100 pb-2">
            🔑 Session Profile
          </h3>
          {currentUser ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Signed in as <span className="font-semibold text-slate-900">{currentUser.username}</span>
              </p>
              <p>System Role: <span className="font-semibold text-blue-600">{currentUser.role}</span></p>
              <button
                onClick={handleSignOut}
                className="mt-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 text-xs font-semibold text-red-700"
              >
                Sign out / 注销
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              <p>You are not signed in.</p>
              <Link href="/login" className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                Sign in
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* User Management Section (Admin Only) */}
      {currentUser?.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="text-lg font-semibold border-b border-slate-100 pb-2">
              👤 {t("createUser")}
            </h3>
            {msg.text && (
              <p className={`p-2.5 rounded text-sm font-semibold border ${
                msg.isError ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
              }`}>
                {msg.text}
              </p>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("usernameLabel")}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("emailLabel")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("passwordLabel")}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("roleLabel")}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                >
                  <option value="USER">{t("roleUser")}</option>
                  <option value="ADMIN">{t("roleSystemAdmin")}</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm transition-colors shadow"
              >
                {t("saveUser")}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold border-b border-slate-100 pb-2">
              📋 {t("registeredUsers")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500">{t("usernameLabel")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">{t("emailLabel")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">{t("roleLabel")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{u.username}</td>
                      <td className="px-4 py-4 text-slate-600">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {u.role === "ADMIN" ? t("roleSystemAdmin") : t("roleUser")}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 hover:border-red-300 rounded px-2 py-1 bg-red-50"
                          >
                            {t("delete")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Demo Accounts List */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2 mb-4">Demo Accounts</h3>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 font-semibold">Username</th>
                <th className="px-4 py-2 font-semibold">Password</th>
                <th className="px-4 py-2 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-4 py-2 font-medium">admin</td>
                <td className="px-4 py-2 font-mono">admin123</td>
                <td className="px-4 py-2">Administrator (System Admin)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">zhang_curator</td>
                <td className="px-4 py-2 font-mono">editor123</td>
                <td className="px-4 py-2">Curator (Project Editor)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">guest</td>
                <td className="px-4 py-2 font-mono">editor123</td>
                <td className="px-4 py-2">Read-only demo (Guest)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
