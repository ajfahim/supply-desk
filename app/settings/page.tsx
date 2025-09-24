"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  FileText,
  Calculator,
  Save,
  Loader2,
  Upload,
  X,
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
  bin: string;
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
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "Steelroot Traders",
    address: {
      street: "",
      city: "Dhaka",
      state: "Dhaka",
      zipCode: "",
      country: "Bangladesh",
    },
    contact: {
      email: "info@steelroottraders.com",
      phone: "+880-2-123456789",
      website: "www.steelroottraders.com",
    },
    logo: "",
    bin: "",
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File size must be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setLogoPreview(base64String);
        setCompanySettings({
          ...companySettings,
          logo: base64String,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    setCompanySettings({
      ...companySettings,
      logo: "",
    });
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompanySettings(data.company);
          if (data.company.logo) {
            setLogoPreview(data.company.logo);
          }
        }
        if (data.quotation) {
          setQuotationSettings({
            authorizedBy: {
              name: data.quotation.authorizedBy?.name || "Md. Ataur Rahaman",
              designation: data.quotation.authorizedBy?.designation || "Proprietor - Optimech Project Solution",
            },
          });
        }
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your application settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6">
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={companySettings.address.state}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        address: {
                          ...companySettings.address,
                          state: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={companySettings.address.zipCode}
                    onChange={(e) =>
                      setCompanySettings({
                        ...companySettings,
                        address: {
                          ...companySettings.address,
                          zipCode: e.target.value,
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

              <div className="grid grid-cols-3 gap-4">
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
              </div>

              <div>
                <Label htmlFor="logo">Company Logo</Label>
                <div className="space-y-4">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="h-20 w-auto border rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <Label htmlFor="logoUpload" className="cursor-pointer">
                          <span className="text-sm text-gray-600">
                            Click to upload logo or drag and drop
                          </span>
                          <br />
                          <span className="text-xs text-gray-500">
                            PNG, JPG up to 2MB
                          </span>
                        </Label>
                      </div>
                    </div>
                  )}
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {!logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="bin">BIN</Label>
                <Input
                  id="bin"
                  value={companySettings.bin}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      bin: e.target.value,
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
                  value={quotationSettings.authorizedBy?.name || ""}
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
                  value={quotationSettings.authorizedBy?.designation || ""}
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
                <Input
                  id="currency"
                  value={pricingSettings.currency}
                  onChange={(e) =>
                    setPricingSettings({
                      ...pricingSettings,
                      currency: e.target.value,
                    })
                  }
                />
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
