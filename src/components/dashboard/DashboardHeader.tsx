"use client";

import { NotificationCenter } from "./NotificationCenter";

export function DashboardHeader() {
  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
      <NotificationCenter />
    </div>
  );
}
