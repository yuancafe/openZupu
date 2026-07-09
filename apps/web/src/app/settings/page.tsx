"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearAuthSession } from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    window.location.href = "/login";
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-2 text-sm text-slate-500">
          Demo environment and session details for OpenZupu.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-medium text-slate-900">Current Session</h3>
        {user ? (
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              Signed in as <span className="font-medium text-slate-900">{user.username}</span>
            </p>
            <p>Role: {user.role}</p>
            <button
              onClick={handleSignOut}
              className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-600">
            <p>You are not signed in.</p>
            <Link href="/login" className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700">
              Sign in
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-medium text-slate-900">Demo Accounts</h3>
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Username</th>
                <th className="px-4 py-2 font-medium">Password</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-4 py-2 font-medium">admin</td>
                <td className="px-4 py-2">admin123</td>
                <td className="px-4 py-2">Administrator</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">zhang_curator</td>
                <td className="px-4 py-2">editor123</td>
                <td className="px-4 py-2">Curator</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">guest</td>
                <td className="px-4 py-2">editor123</td>
                <td className="px-4 py-2">Read-only demo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
