"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Plug,
  Users,
  Bell,
  Building2,
  Phone,
  Shield,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account, integrations, and team
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Account Info */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Business Information
              </CardTitle>
              <CardDescription>
                Your business details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Business Name</Label>
                  <Input
                    defaultValue="My Business"
                    className="bg-white/80 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Slug</Label>
                  <Input
                    defaultValue="my-business"
                    className="bg-white/80 border-slate-200 font-mono text-sm"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Business Type</Label>
                  <Input
                    defaultValue="Services"
                    className="bg-white/80 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Timezone</Label>
                  <Input
                    defaultValue="Europe/Paris"
                    className="bg-white/80 border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button className="bg-indigo-500 hover:bg-indigo-600">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Plan & Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div>
                  <p className="font-semibold text-slate-800">Pro Plan</p>
                  <p className="text-sm text-slate-500">2,000 messages/month</p>
                </div>
                <Button variant="outline" className="border-indigo-200 text-indigo-600">
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-white/60 backdrop-blur-sm border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions. Please be careful.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* WhatsApp / Twilio */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                WhatsApp (Twilio)
              </CardTitle>
              <CardDescription>
                Connect your WhatsApp Business number via Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">WhatsApp Business</p>
                    <p className="text-sm text-slate-500">Not connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-slate-300" />
                  <Button className="bg-green-500 hover:bg-green-600">
                    Connect
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Twilio Account SID</Label>
                  <Input
                    type="password"
                    placeholder="AC..."
                    className="bg-white/80 border-slate-200 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Twilio Auth Token</Label>
                  <Input
                    type="password"
                    placeholder="***"
                    className="bg-white/80 border-slate-200 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-600">WhatsApp Number</Label>
                  <Input
                    placeholder="+33612345678"
                    className="bg-white/80 border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button className="bg-indigo-500 hover:bg-indigo-600">
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-indigo-500" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Configure webhooks for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Inbound Webhook URL</p>
                    <p className="text-xs text-slate-400 font-mono">
                      https://yourapp.com/api/webhooks/twilio
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Integrations */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Plug className="h-5 w-5 text-indigo-500" />
                Other Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {["Calendly", "Google Calendar", "Stripe", "Zapier"].map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="font-medium text-slate-800">{name}</span>
                    <Button variant="outline" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage who has access to your workspace
                  </CardDescription>
                </div>
                <Button className="bg-indigo-500 hover:bg-indigo-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Owner */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      B
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Billel</p>
                      <p className="text-sm text-slate-500">billel@lumelia.io</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-medium">
                      Owner
                    </span>
                  </div>
                </div>

                {/* Empty state for more members */}
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No other team members yet</p>
                  <p className="text-sm">Invite colleagues to collaborate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800">Roles & Permissions</CardTitle>
              <CardDescription>
                Define what each role can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { role: "Owner", desc: "Full access to all features", color: "indigo" },
                  { role: "Admin", desc: "Manage team and settings", color: "blue" },
                  { role: "Agent", desc: "Handle conversations only", color: "green" },
                ].map((item) => (
                  <div
                    key={item.role}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.role}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs bg-${item.color}-100 text-${item.color}-700`}>
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "New conversations", desc: "When a new customer starts a chat" },
                    { label: "Escalated conversations", desc: "When AI escalates to human" },
                    { label: "Daily summary", desc: "Daily report of activity" },
                    { label: "Weekly analytics", desc: "Weekly performance report" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  In-App Notifications
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Sound alerts", desc: "Play sound for new messages" },
                    { label: "Desktop notifications", desc: "Show browser notifications" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
