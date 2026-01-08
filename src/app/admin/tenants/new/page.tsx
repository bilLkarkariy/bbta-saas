"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  CheckCircle,
  XCircle,
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

export default function NewTenantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    businessName: "",
    businessType: "services",
    plan: "starter",
    status: "trial",
    phone: "",
    address: "",
    city: "",
    timezone: "Europe/Paris",
    services: "",
    pricing: "",
    ownerEmail: "",
    ownerName: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services: formData.services
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create tenant");
      }

      setMessage({ type: "success", text: "Tenant created successfully!" });
      setTimeout(() => {
        router.push(`/admin/tenants/${data.id}`);
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create tenant",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-800 hover:bg-white/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create New Tenant</h1>
            <p className="text-slate-500">Set up a new business account</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Details */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">
                  Tenant Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="My Business"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="my-business"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Business Name</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="My Business SARL"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Business Type</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, businessType: v })
                  }
                >
                  <SelectTrigger className="bg-white/80 border-slate-200 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beaute">Beauté</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="medical">Médical</SelectItem>
                    <SelectItem value="generic">Générique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(v) => setFormData({ ...formData, plan: v })}
                >
                  <SelectTrigger className="bg-white/80 border-slate-200 text-slate-800">
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
                <Label className="text-slate-600">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-white/80 border-slate-200 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(v) =>
                    setFormData({ ...formData, timezone: v })
                  }
                >
                  <SelectTrigger className="bg-white/80 border-slate-200 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                placeholder="123 Rue de la Paix"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Services & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600">
                Services (comma-separated)
              </Label>
              <Input
                value={formData.services}
                onChange={(e) =>
                  setFormData({ ...formData, services: e.target.value })
                }
                className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                placeholder="Service 1, Service 2, Service 3"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Pricing Info</Label>
              <Textarea
                value={formData.pricing}
                onChange={(e) =>
                  setFormData({ ...formData, pricing: e.target.value })
                }
                className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                rows={3}
                placeholder="Describe your pricing..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Owner Account */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Owner Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Create the first user (owner) for this tenant. They will receive
              an invitation to set up their Clerk account.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">
                  Owner Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerEmail: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="owner@business.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Owner Name</Label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  className="bg-white/80 border-slate-200 text-slate-800 focus:border-indigo-300 focus:ring-indigo-200"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/admin" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white/50"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
