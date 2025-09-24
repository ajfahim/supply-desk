"use client";

import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
