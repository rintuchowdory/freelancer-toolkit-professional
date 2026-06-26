import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

const THRESHOLD_CURRENT_YEAR = 22000; // €22.000
const THRESHOLD_PREVIOUS_YEAR = 50000; // €50.000

export default function SmallBusinessChecker() {
  const { user } = useAuth();
  const [currentYearRevenue, setCurrentYearRevenue] = useState("");
  const [previousYearRevenue, setPreviousYearRevenue] = useState("");

  const currentRevenue = parseFloat(currentYearRevenue) || 0;
  const previousRevenue = parseFloat(previousYearRevenue) || 0;

  // Determine eligibility
  const isEligible =
    currentRevenue <= THRESHOLD_CURRENT_YEAR &&
    previousRevenue <= THRESHOLD_PREVIOUS_YEAR;

  const currentYearPercentage = Math.min((currentRevenue / THRESHOLD_CURRENT_YEAR) * 100, 100);
  const previousYearPercentage = Math.min((previousRevenue / THRESHOLD_PREVIOUS_YEAR) * 100, 100);

  // Monthly projection data
  const monthlyProjection = [
    { month: "Jan", revenue: 1500 },
    { month: "Feb", revenue: 1800 },
    { month: "Mär", revenue: 2100 },
    { month: "Apr", revenue: 1900 },
    { month: "Mai", revenue: 2200 },
    { month: "Jun", revenue: 2000 },
    { month: "Jul", revenue: 2300 },
    { month: "Aug", revenue: 2100 },
    { month: "Sep", revenue: 2400 },
    { month: "Okt", revenue: 2200 },
    { month: "Nov", revenue: 2500 },
    { month: "Dez", revenue: 2800 },
  ];

  const projectedAnnualRevenue = monthlyProjection.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kleinunternehmer-Prüfer (§19 UStG)</h1>
          <p className="text-muted-foreground mt-2">
            Überprüfen Sie Ihre Berechtigung zur Kleinunternehmerregelung
          </p>
        </div>

        {/* Eligibility Status */}
        <Card className={`border-2 ${isEligible ? "border-green-500 dark:border-green-600" : "border-orange-500 dark:border-orange-600"}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isEligible ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Sie sind berechtigt
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    Sie sind nicht berechtigt
                  </>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${isEligible ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`}>
              {isEligible
                ? "Sie können die Kleinunternehmerregelung in Anspruch nehmen und sind von der Umsatzsteuer befreit."
                : "Ihre Umsätze überschreiten die Grenzen der Kleinunternehmerregelung. Sie müssen Umsatzsteuer abführen."}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <Card className="border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Umsatzzahlen eingeben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentYear">Umsatz laufendes Jahr (€)</Label>
                  <Input
                    id="currentYear"
                    type="number"
                    min="0"
                    step="100"
                    value={currentYearRevenue}
                    onChange={(e) => setCurrentYearRevenue(e.target.value)}
                    placeholder="z.B. 18000"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Grenzwert: €{THRESHOLD_CURRENT_YEAR.toLocaleString("de-DE")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="previousYear">Umsatz Vorjahr (€)</Label>
                  <Input
                    id="previousYear"
                    type="number"
                    min="0"
                    step="100"
                    value={previousYearRevenue}
                    onChange={(e) => setPreviousYearRevenue(e.target.value)}
                    placeholder="z.B. 45000"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Grenzwert: €{THRESHOLD_PREVIOUS_YEAR.toLocaleString("de-DE")}
                  </p>
                </div>

                <div className="pt-4 space-y-3 border-t border-border">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Laufendes Jahr</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">€{currentRevenue.toLocaleString("de-DE")}</span>
                      <span className="text-xs text-muted-foreground">{currentYearPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all duration-300"
                        style={{ width: `${currentYearPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Vorjahr</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">€{previousRevenue.toLocaleString("de-DE")}</span>
                      <span className="text-xs text-muted-foreground">{previousYearPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all duration-300"
                        style={{ width: `${previousYearPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    Beide Grenzwerte müssen eingehalten werden, um die Kleinunternehmerregelung zu nutzen.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Legal Info */}
            <Card className="border-border bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-base text-amber-900 dark:text-amber-100">§19 UStG - Kleinunternehmerregelung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
                <div>
                  <p className="font-semibold mb-1">Voraussetzungen:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Umsatz im laufenden Jahr nicht über €22.000</li>
                    <li>Umsatz im Vorjahr nicht über €50.000</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Vorteile:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Keine Umsatzsteuer auf Rechnungen</li>
                    <li>Vereinfachte Buchhaltung</li>
                    <li>Keine Vorsteuerabzug möglich</li>
                  </ul>
                </div>
                <p className="text-xs italic">
                  Diese Informationen sind allgemeiner Natur. Konsultieren Sie einen Steuerberater für personalisierte Beratung.
                </p>
              </CardContent>
            </Card>

            {/* Annual Projection */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Jahresprojektion
                </CardTitle>
                <CardDescription>Geschätzter Jahresumsatz basierend auf monatlichen Durchschnitten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Projizierter Jahresumsatz</p>
                  <p className="text-3xl font-bold text-foreground font-mono">
                    €{projectedAnnualRevenue.toLocaleString("de-DE")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {projectedAnnualRevenue <= THRESHOLD_CURRENT_YEAR ? (
                      <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        ✓ Unter Grenzwert
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                        ⚠ Über Grenzwert
                      </Badge>
                    )}
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyProjection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                      formatter={(value) => `€${value.toLocaleString("de-DE")}`}
                    />
                    <Bar dataKey="revenue" fill="var(--accent)" name="Umsatz" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Threshold Visualization */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Grenzwert-Übersicht</CardTitle>
                <CardDescription>Vergleich mit den gesetzlichen Grenzen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">Laufendes Jahr</span>
                    <span className="text-sm font-mono">
                      €{currentRevenue.toLocaleString("de-DE")} / €{THRESHOLD_CURRENT_YEAR.toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentRevenue <= THRESHOLD_CURRENT_YEAR ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min((currentRevenue / THRESHOLD_CURRENT_YEAR) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentRevenue <= THRESHOLD_CURRENT_YEAR
                      ? `${(THRESHOLD_CURRENT_YEAR - currentRevenue).toLocaleString("de-DE")} € Spielraum`
                      : `${(currentRevenue - THRESHOLD_CURRENT_YEAR).toLocaleString("de-DE")} € über Grenzwert`}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">Vorjahr</span>
                    <span className="text-sm font-mono">
                      €{previousRevenue.toLocaleString("de-DE")} / €{THRESHOLD_PREVIOUS_YEAR.toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        previousRevenue <= THRESHOLD_PREVIOUS_YEAR ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min((previousRevenue / THRESHOLD_PREVIOUS_YEAR) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {previousRevenue <= THRESHOLD_PREVIOUS_YEAR
                      ? `${(THRESHOLD_PREVIOUS_YEAR - previousRevenue).toLocaleString("de-DE")} € Spielraum`
                      : `${(previousRevenue - THRESHOLD_PREVIOUS_YEAR).toLocaleString("de-DE")} € über Grenzwert`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
