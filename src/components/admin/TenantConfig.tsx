"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  Users,
  HelpCircle,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
  MessageSquare,
  Calendar,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  updateTenantConfig,
  updateTenantTwilio,
  testTenantTwilio,
} from "@/app/admin/actions";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string | null;
  isActive: boolean;
};

type Integration = {
  id: string;
  type: string;
  status: string;
  credentials: unknown;
  config: unknown;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  clerkId: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  businessName: string | null;
  whatsappNumber: string | null;
  plan: string;
  status: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  timezone: string;
  businessHours: string | null;
  services: string[];
  pricing: string | null;
  users: User[];
  faqs: FAQ[];
  integrations: Integration[];
  _count: {
    conversations: number;
    bookings: number;
    contacts: number;
  };
};

export function TenantConfig({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "twilio" | "faqs" | "users"
  >("general");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: tenant.name,
    businessName: tenant.businessName || "",
    businessType: tenant.businessType,
    plan: tenant.plan,
    status: tenant.status,
    phone: tenant.phone || "",
    address: tenant.address || "",
    city: tenant.city || "",
    timezone: tenant.timezone,
    services: tenant.services.join(", "),
    pricing: tenant.pricing || "",
  });

  const twilioIntegration = tenant.integrations.find((i) => i.type === "twilio");
  const [twilioData, setTwilioData] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: tenant.whatsappNumber || "",
  });

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateTenantConfig(tenant.id, {
        ...formData,
        services: formData.services.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (result.success) {
        setMessage({ type: "success", text: "Configuration saved!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTwilio = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateTenantTwilio(tenant.id, twilioData);
      if (result.success) {
        setMessage({ type: "success", text: "Twilio credentials saved!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save Twilio config" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTwilio = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const result = await testTenantTwilio(tenant.id);
      if (result.success) {
        setMessage({ type: "success", text: "Twilio connection successful!" });
      } else {
        setMessage({ type: "error", text: result.error || "Connection failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to test connection" });
    } finally {
      setTesting(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "twilio", label: "Twilio/WhatsApp", icon: Phone },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
    { id: "users", label: "Users", icon: Users },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
            <p className="text-gray-400">@{tenant.slug}</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {tenant._count.conversations}
              </p>
              <p className="text-xs text-gray-500">Conversations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {tenant._count.bookings}
              </p>
              <p className="text-xs text-gray-500">Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <UserCircle className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {tenant._count.contacts}
              </p>
              <p className="text-xs text-gray-500">Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "text-gray-400 hover:text-white"
            }
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Tenant Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Business Name</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Business Type</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, businessType: v })
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beaute">Beaute</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(v) => setFormData({ ...formData, plan: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Timezone</Label>
                <Input
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Services (comma-separated)</Label>
              <Input
                value={formData.services}
                onChange={(e) =>
                  setFormData({ ...formData, services: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white"
                placeholder="Service 1, Service 2, Service 3"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Pricing</Label>
              <Textarea
                value={formData.pricing}
                onChange={(e) =>
                  setFormData({ ...formData, pricing: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "twilio" && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Twilio / WhatsApp</CardTitle>
              {twilioIntegration?.status === "connected" ? (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                  <XCircle className="h-4 w-4" />
                  Not Connected
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Account SID</Label>
              <Input
                value={twilioData.accountSid}
                onChange={(e) =>
                  setTwilioData({ ...twilioData, accountSid: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white font-mono"
                placeholder="AC..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Auth Token</Label>
              <Input
                type="password"
                value={twilioData.authToken}
                onChange={(e) =>
                  setTwilioData({ ...twilioData, authToken: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white font-mono"
                placeholder="Enter new token to update"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">WhatsApp Number</Label>
              <Input
                value={twilioData.whatsappNumber}
                onChange={(e) =>
                  setTwilioData({ ...twilioData, whatsappNumber: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white"
                placeholder="+14155238886"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveTwilio}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Credentials
              </Button>
              <Button
                onClick={handleTestTwilio}
                disabled={testing}
                variant="outline"
                className="border-white/10 text-gray-400 hover:text-white"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Webhook URL:</strong>
              </p>
              <code className="text-sm text-indigo-400 block mt-1">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/webhooks/twilio`
                  : "/api/webhooks/twilio"}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Configure this URL in your Twilio WhatsApp Sandbox settings
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "faqs" && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              FAQs ({tenant.faqs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenant.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{faq.question}</p>
                      <p className="text-gray-400 text-sm mt-1">{faq.answer}</p>
                      {faq.keywords.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {faq.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        faq.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {faq.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
              {tenant.faqs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No FAQs configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "users" && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Users ({tenant.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenant.users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.name || "No name"}
                      </p>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs uppercase">
                    {user.role}
                  </span>
                </div>
              ))}
              {tenant.users.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
