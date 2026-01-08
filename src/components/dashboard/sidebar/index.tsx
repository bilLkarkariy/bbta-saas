"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import {
  Search,
  ChevronDown,
  Bell,
  MoreVertical,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { navigation } from "@/config/navigation";
import type { SidebarProps } from "./types";

export function Sidebar({
  user,
  workspace,
  usage,
  onLogout,
  onWorkspaceCreate,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cmd+K handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("sidebar-search");
      searchInput?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const usagePercentage = Math.round((usage.current / usage.limit) * 100);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-full transition-all duration-300 ease-in-out z-20",
          "bg-transparent",
          isCollapsed ? "w-20" : "w-72"
        )}
        aria-label="Main navigation"
      >
        {/* Header / Workspace Switcher */}
        <div className={cn("flex items-center", isCollapsed ? "justify-center p-3 h-14" : "p-3 h-14 justify-between")}>
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2 hover:bg-white/40 h-10 gap-2 rounded-xl text-slate-800">
                  <div className="h-7 w-7 rounded-lg bg-[#1e293b] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-indigo-500/10">
                    {workspace.initial}
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <span className="block text-sm font-semibold truncate leading-none text-slate-800">{workspace.name}</span>
                    <span className="block text-[10px] text-slate-400 truncate leading-none mt-0.5">{workspace.plan}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                <DropdownMenuItem>{workspace.name} (Current)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onWorkspaceCreate}>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border border-dashed rounded flex items-center justify-center text-xs">+</div>
                    Create Workspace
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-indigo-500/10">
              {workspace.initial}
            </div>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute -right-3 top-5 h-6 w-6 rounded-full border border-white/60 bg-white/80 backdrop-blur-md shadow-sm z-50",
              "text-slate-400 hover:text-slate-800 hidden md:flex"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
          </Button>
        </div>

        {/* Quick Search */}
        <div className="px-3 py-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-9 hover:bg-white/40">
                  <Search className="h-4 w-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Search (Cmd+K)</TooltipContent>
            </Tooltip>
          ) : (
            <div className="relative">
              <label htmlFor="sidebar-search" className="sr-only">Search navigation</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="sidebar-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search navigation"
                className="w-full h-8 pl-9 pr-10 rounded-xl bg-white/50 border border-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400/50 hover:bg-white/60 transition-colors"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-white/40 px-1 rounded pointer-events-none">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* Navigation - scrollable only when needed, scrollbar visible on hover */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-1 scrollbar-on-hover" aria-label="Dashboard navigation">
          {navigation.map((group, index) => (
            <div key={group.title || `group-${index}`} className="mb-1.5">
              {!isCollapsed && group.title && (
                <h4 className="px-3 mb-1 text-[10px] font-semibold text-slate-400/80 tracking-widest uppercase">
                  {group.title}
                </h4>
              )}
              {isCollapsed && group.title && (
                <div className="h-px bg-white/20 mx-2 my-2" aria-hidden="true" />
              )}

              <ul className="space-y-0.5" role="list">
                {group.items.map((item) => {
                  const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                  const linkContent = (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                        isActive
                          ? "bg-[#1e293b] text-white shadow-lg shadow-indigo-500/20"
                          : "text-slate-500 hover:bg-white/40 hover:text-slate-800",
                        isCollapsed && "justify-center px-0 py-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-800"
                        )}
                        aria-hidden="true"
                      />

                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.title}</span>
                          <div className="flex items-center gap-1.5">
                            {item.pro && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-indigo-500 text-[9px] text-white font-bold shadow-sm">
                                <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                                PRO
                              </span>
                            )}
                            {item.badge && (
                              <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold shadow-sm leading-none">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {item.title}
                            {item.badge && (
                              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">
                                {item.badge}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{linkContent}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer / Usage / Profile */}
        <div className={cn("mt-auto p-3", isCollapsed && "p-2")}>
          {/* Usage Stats - Only show when expanded */}
          {!isCollapsed && (
            <div className="mb-2 px-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Plan: Pro</span>
                <span className="text-indigo-600 font-bold">
                  {usage.current.toLocaleString()}/{usage.limit.toLocaleString()} msgs
                </span>
              </div>
              <div
                className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={usagePercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${usage.label}: ${usagePercentage}% used`}
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-primary rounded-full shadow-sm transition-all"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto hover:bg-white/40 rounded-xl",
                  isCollapsed ? "p-0 justify-center h-12 w-12" : "p-2 gap-3"
                )}
              >
                <div className="relative">
                  <Avatar className={cn("border-2 border-white shadow-sm ring-1 ring-slate-200/50", isCollapsed ? "h-9 w-9" : "h-9 w-9")}>
                    <AvatarImage src={user.avatarUrl} alt={`${user.name}'s profile picture`} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate leading-none">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate opacity-80 mt-1">{user.email}</p>
                    </div>
                    <MoreVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "end"}
              side={isCollapsed ? "right" : "bottom"}
              className="w-56 glass-card"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" aria-hidden="true" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              {user.superAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-red-500" aria-hidden="true" />
                      <span className="text-red-500 font-medium">Super Admin</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export type { SidebarProps, SidebarUser, SidebarWorkspace, SidebarUsage } from "./types";
