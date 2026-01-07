"use client";

import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Sidebar, type SidebarProps } from "./index";

type SidebarWrapperProps = Omit<SidebarProps, "onLogout" | "onSettingsClick" | "onNotificationsClick" | "onWorkspaceCreate">;

export function SidebarWrapper(props: SidebarWrapperProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleSettingsClick = () => {
    router.push("/dashboard/settings");
  };

  const handleNotificationsClick = () => {
    // TODO: Open notifications panel
  };

  const handleWorkspaceCreate = () => {
    // TODO: Open workspace creation modal
  };

  return (
    <Sidebar
      {...props}
      onLogout={handleLogout}
      onSettingsClick={handleSettingsClick}
      onNotificationsClick={handleNotificationsClick}
      onWorkspaceCreate={handleWorkspaceCreate}
    />
  );
}
