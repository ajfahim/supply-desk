"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Building2, FileText, Calculator, Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface CompanySettings {
  companyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
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
  defaultValidityDays: number;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultWarranty: string;
  quotationPrefix: string;
  autoNumbering: boolean;
}

interface PricingSettings {
  defaultProfitMargin: number;
  showVendorCosts: boolean;
  allowNegativeMargins: boolean;
  roundPrices: boolean;
  currency: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  quotationExpiry: boolean;
  lowStock: boolean;
  newOrders: boolean;
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
    defaultValidityDays: 15,
    defaultTaxRate: 15,
    defaultPaymentTerms: "50% Advance with Work order, rest after delivery",
    defaultDeliveryTerms: "Delivery time: Supply 3-5 days After Getting PO",
    defaultWarranty: "1 year manufacturer warranty",
    quotationPrefix: "SRT",
    autoNumbering: true,
  });

  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    defaultProfitMargin: 20,
    showVendorCosts: false,
    allowNegativeMargins: false,
    roundPrices: true,
    currency: "BDT",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    quotationExpiry: true,
    lowStock: false,
    newOrders: true,
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
        if (data.notifications) setNotificationSettings(data.notifications);
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
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: companySettings,
          quotation: quotationSettings,
          pricing: pricingSettings,
          notifications: notificationSettings,
        }),
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
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validityDays">Validity (Days)</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={quotationSettings.defaultValidityDays}
                    onChange={(e) =>
                      setQuotationSettings({
                        ...quotationSettings,
                        defaultValidityDays: parseInt(e.target.value) || 15,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={quotationSettings.defaultTaxRate}
                    onChange={(e) =>
                      setQuotationSettings({
                        ...quotationSettings,
                        defaultTaxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
                <Input
                  id="quotationPrefix"
                  value={quotationSettings.quotationPrefix}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      quotationPrefix: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoNumbering"
                  checked={quotationSettings.autoNumbering}
                  onCheckedChange={(checked) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      autoNumbering: checked,
                    })
                  }
                />
                <Label htmlFor="autoNumbering">Auto Numbering</Label>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                <Textarea
                  id="paymentTerms"
                  value={quotationSettings.defaultPaymentTerms}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      defaultPaymentTerms: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="deliveryTerms">Default Delivery Terms</Label>
                <Textarea
                  id="deliveryTerms"
                  value={quotationSettings.defaultDeliveryTerms}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      defaultDeliveryTerms: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="warranty">Default Warranty</Label>
                <Input
                  id="warranty"
                  value={quotationSettings.defaultWarranty}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      defaultWarranty: e.target.value,
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
                  onValueChange={(value) =>
                    setPricingSettings({
                      ...pricingSettings,
                      currency: value,
                    })
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

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="quotationExpiry"
                    checked={notificationSettings.quotationExpiry}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        quotationExpiry: checked,
                      })
                    }
                  />
                  <Label htmlFor="quotationExpiry">Quotation Expiry Alerts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="lowStock"
                    checked={notificationSettings.lowStock}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        lowStock: checked,
                      })
                    }
                  />
                  <Label htmlFor="lowStock">Low Stock Alerts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="newOrders"
                    checked={notificationSettings.newOrders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        newOrders: checked,
                      })
                    }
                  />
                  <Label htmlFor="newOrders">New Order Notifications</Label>
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
