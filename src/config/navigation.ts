import {
  Home,
  MessageSquare,
  Users,
  UsersRound,
  Megaphone,
  FileText,
  Calendar,
  Target,
  HelpCircle,
  Zap,
  BarChart2,
  LineChart,
  Plug,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  pro?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Home },
    ]
  },
  {
    title: "COMMUNICATION",
    items: [
      { title: "Inbox", href: "/dashboard/conversations", icon: MessageSquare, badge: 3 },
      { title: "Contacts", href: "/dashboard/contacts", icon: Users },
      { title: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { title: "Templates", href: "/dashboard/templates", icon: FileText },
    ]
  },
  {
    title: "BUSINESS",
    items: [
      { title: "Booking", href: "/dashboard/booking", icon: Calendar },
      { title: "Pipeline", href: "/dashboard/pipeline", icon: Target },
    ]
  },
  {
    title: "AUTOMATION",
    items: [
      { title: "FAQs", href: "/dashboard/faq", icon: HelpCircle },
      { title: "Flows", href: "/dashboard/flows", icon: Zap, pro: true },
    ]
  },
  {
    title: "INSIGHTS",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { title: "Reports", href: "/dashboard/reports", icon: LineChart },
    ]
  },
  {
    title: "SETTINGS",
    items: [
      { title: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { title: "Team", href: "/dashboard/team", icon: UsersRound },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
];
