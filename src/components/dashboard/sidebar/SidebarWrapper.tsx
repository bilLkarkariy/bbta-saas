"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { Sidebar, type SidebarProps } from "./index";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type SidebarWrapperProps = Omit<SidebarProps, "onLogout" | "onSettingsClick" | "onNotificationsClick" | "onWorkspaceCreate">;

export function SidebarWrapper(props: SidebarWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close drawer when pathname changes - using derived state pattern
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

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

  const sidebarProps = {
    ...props,
    onLogout: handleLogout,
    onSettingsClick: handleSettingsClick,
    onNotificationsClick: handleNotificationsClick,
    onWorkspaceCreate: handleWorkspaceCreate,
  };

  return (
    <>
      {/* Mobile hamburger button - visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </Button>

      {/* Mobile drawer - Sheet component */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-80 p-0 bg-gradient-to-br from-[#F8FAFC] to-[#E2E6EE] border-r-0"
        >
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <Sidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex md:h-full">
        <Sidebar {...sidebarProps} />
      </div>
    </>
  );
}
