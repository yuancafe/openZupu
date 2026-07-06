import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenZupu",
  description: "An open source platform for genealogical data management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <div className="flex flex-col min-h-screen">
          <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-10">
            <h1 className="text-xl font-bold tracking-tight text-blue-600">OpenZupu</h1>
          </header>
          <div className="flex flex-1">
            <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block">
              <nav className="space-y-2">
                <a href="/" className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium">Projects</a>
                <a href="/settings" className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium">Settings</a>
              </nav>
            </aside>
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
