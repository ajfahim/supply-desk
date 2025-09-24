"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-16">
        <TopNavbar />
        <main className="pt-16 overflow-auto h-full">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
