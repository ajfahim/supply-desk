"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  FileText,
  Calculator,
  Save,
  Loader2,
} from "lucide-react";

interface CompanySettings {
  companyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  logo: string;
  taxId: string;
}

interface QuotationSettings {
  authorizedBy: {
    name: string;
    designation: string;
  };
}

interface PricingSettings {
  defaultProfitMargin: number;
  showVendorCosts: boolean;
  allowNegativeMargins: boolean;
  roundPrices: boolean;
  currency: string;
}


export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "Steelroot Traders",
    address: {
      street: "",
      city: "Dhaka",
      state: "Dhaka",
      country: "Bangladesh",
      zipCode: "",
    },
    contact: {
      email: "info@steelroottraders.com",
      phone: "+880-2-123456789",
      website: "www.steelroottraders.com",
    },
    logo: "",
    taxId: "",
  });

  const [quotationSettings, setQuotationSettings] = useState<QuotationSettings>({
    authorizedBy: {
      name: "Md. Ataur Rahaman",
      designation: "Proprietor - Optimech Project Solution",
    },
  });

  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    defaultProfitMargin: 20,
    showVendorCosts: false,
    allowNegativeMargins: false,
    roundPrices: true,
    currency: "BDT",
  });


  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.company) setCompanySettings(data.company);
        if (data.quotation) setQuotationSettings(data.quotation);
        if (data.pricing) setPricingSettings(data.pricing);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settings = {
        company: companySettings,
        quotation: quotationSettings,
        pricing: pricingSettings,
      };
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure your application preferences and defaults
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companySettings.companyName}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      companyName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companySettings.contact.email}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      contact: {
                        ...companySettings.contact,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={companySettings.contact.phone}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      contact: {
                        ...companySettings.contact,
                        phone: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={companySettings.contact.website}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      contact: {
                        ...companySettings.contact,
                        website: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={companySettings.address.street}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      address: {
                        ...companySettings.address,
                        street: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={companySettings.address.city}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        address: {
                          ...companySettings.address,
                          city: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={companySettings.address.country}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        address: {
                          ...companySettings.address,
                          country: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={companySettings.taxId}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      taxId: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quotation Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="authorizedName">Authorized Person Name</Label>
                <Input
                  id="authorizedName"
                  value={quotationSettings.authorizedBy.name}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      authorizedBy: {
                        ...quotationSettings.authorizedBy,
                        name: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="authorizedDesignation">Designation</Label>
                <Input
                  id="authorizedDesignation"
                  value={quotationSettings.authorizedBy.designation}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      authorizedBy: {
                        ...quotationSettings.authorizedBy,
                        designation: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profitMargin">Default Profit Margin (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  value={pricingSettings.defaultProfitMargin}
                  onChange={(e) =>
                    setPricingSettings({
                      ...pricingSettings,
                      defaultProfitMargin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={pricingSettings.currency || "BDT"}
                  onValueChange={(value: string) => {
                    setPricingSettings({
                      ...pricingSettings,
                      currency: value,
                    })
                  }
                }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">BDT - Bangladeshi Taka</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showVendorCosts"
                    checked={pricingSettings.showVendorCosts}
                    onCheckedChange={(checked) =>
                      setPricingSettings({
                        ...pricingSettings,
                        showVendorCosts: checked,
                      })
                    }
                  />
                  <Label htmlFor="showVendorCosts">Show Vendor Costs</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowNegativeMargins"
                    checked={pricingSettings.allowNegativeMargins}
                    onCheckedChange={(checked) =>
                      setPricingSettings({
                        ...pricingSettings,
                        allowNegativeMargins: checked,
                      })
                    }
                  />
                  <Label htmlFor="allowNegativeMargins">Allow Negative Margins</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="roundPrices"
                    checked={pricingSettings.roundPrices}
                    onCheckedChange={(checked) =>
                      setPricingSettings({
                        ...pricingSettings,
                        roundPrices: checked,
                      })
                    }
                  />
                  <Label htmlFor="roundPrices">Round Prices</Label>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={saveSettings} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving Settings..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
