export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  superAdmin?: boolean;
}

export interface SidebarWorkspace {
  name: string;
  plan: string;
  initial: string;
}

export interface SidebarUsage {
  current: number;
  limit: number;
  label: string;
}

export interface SidebarProps {
  user: SidebarUser;
  workspace: SidebarWorkspace;
  usage: SidebarUsage;
  onLogout?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onWorkspaceCreate?: () => void;
  onWorkspaceSwitch?: (workspaceId: string) => void;
}
