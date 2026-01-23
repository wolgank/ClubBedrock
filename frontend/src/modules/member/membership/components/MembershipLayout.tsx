// src/modules/user/membership/MembershipLayout.tsx
import React from "react";
import TabNavigation from "./TabNavigation";
import { Outlet } from "react-router-dom";

export default function MembershipLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-background)]">
      <TabNavigation />
      <main className="container mx-auto px-6 py-4">
        <Outlet />
      </main>
    </div>
  );
}