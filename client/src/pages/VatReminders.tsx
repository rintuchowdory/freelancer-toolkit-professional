import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Calendar, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";

const VAT_DEADLINES = [
  {
    id: "voranmeldung",
    name: "Umsatzsteuer-Voranmeldung",
    description: "Monatliche oder vierteljährliche Voranmeldung der Umsatzsteuer",
    frequency: "Monatlich",
    deadline: "10. des Folgemonats",
    color: "bg-orange-100 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    textColor: "text-orange-900 dark:text-orange-100",
  },
  {
    id: "jahreserklarung",
    name: "Umsatzsteuer-Jahreserklärung",
    description: "Jährliche Abschlussrechnung der Umsatzsteuer",
    frequency: "Jährlich",
    deadline: "31. Mai des Folgejahres",
    color: "bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
  },
  {
    id: "euer",
    name: "Einnahmen-Überschuss-Rechnung (EÜR)",
    description: "Gewinnermittlung für Freiberufler und Gewerbetreibende",
    frequency: "Jährlich",
    deadline: "31. Mai des Folgejahres",
    color: "bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800",
    textColor: "text-green-900 dark:text-green-100",
  },
  {
    id: "steuererklarung",
    name: "Einkommensteuererklärung",
    description: "Persönliche Steuererklärung mit Einkünften aus Freiberuf",
    frequency: "Jährlich",
    deadline: "31. Juli des Folgejahres",
    color: "bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    textColor: "text-purple-900 dark:text-purple-100",
  },
];

export default function VatReminders() {
  const { user } = useAuth();
  const { data: reminders, isLoading } = trpc.vatReminders.list.useQuery();

  const calculateDaysUntil = (deadline: string): number => {
    const today = new Date();
    const nextMonth = addMonths(today, 1);

    if (deadline.includes("10.")) {
      const nextDeadline = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);
      return Math.ceil((nextDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else if (deadline.includes("31. Mai")) {
      const nextDeadline = new Date(nextMonth.getFullYear(), 4, 31);
      return Math.ceil((nextDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else if (deadline.includes("31. Juli")) {
      const nextDeadline = new Date(nextMonth.getFullYear(), 6, 31);
      return Math.ceil((nextDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const getStatusBadge = (daysUntil: number) => {
    if (daysUntil <= 7) {
      return <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Dringend</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">Bald fällig</Badge>;
    } else {
      return <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Noch Zeit</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Steuerfrist-Verwaltung</h1>
          <p className="text-muted-foreground mt-2">
            Übersicht aller wichtigen Steuerfälligkeiten und Abgabefristen
          </p>
        </div>

        {/* Important Alert */}
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Verpassen Sie keine Fristen! Aktivieren Sie Benachrichtigungen, um rechtzeitig erinnert zu werden.
          </AlertDescription>
        </Alert>

        {/* Deadlines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VAT_DEADLINES.map((deadline) => {
            const daysUntil = calculateDaysUntil(deadline.deadline);
            return (
              <Card key={deadline.id} className={`border-2 ${deadline.color}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className={`text-base ${deadline.textColor}`}>{deadline.name}</CardTitle>
                      <CardDescription className={deadline.textColor}>{deadline.description}</CardDescription>
                    </div>
                    <Calendar className={`w-5 h-5 ${deadline.textColor}`} />
                  </div>
                </CardHeader>
                <CardContent className={`space-y-3 ${deadline.textColor}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold opacity-70">Häufigkeit</p>
                      <p className="text-sm font-mono">{deadline.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold opacity-70">Frist</p>
                      <p className="text-sm font-mono">{deadline.deadline}</p>
                    </div>
                  </div>

                  <div className="bg-white/20 dark:bg-black/20 p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Tage bis Frist:</span>
                      <span className="text-lg font-bold font-mono">{daysUntil}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(daysUntil)}
                    <Button variant="ghost" size="sm" className={`${deadline.textColor} hover:bg-white/20 dark:hover:bg-black/20`}>
                      <Bell className="w-4 h-4 mr-1" />
                      Erinnern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legal Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Wichtige Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Umsatzsteuer-Voranmeldung</h4>
              <p className="text-muted-foreground">
                Monatlich oder vierteljährlich fällig (abhängig von Ihrem Umsatz). Frist: 10. des Folgemonats.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Jahreserklärung</h4>
              <p className="text-muted-foreground">
                Abschließende Umsatzsteuer-Erklärung für das Kalenderjahr. Frist: 31. Mai des Folgejahres.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">EÜR (Einnahmen-Überschuss-Rechnung)</h4>
              <p className="text-muted-foreground">
                Gewinnermittlung für Freiberufler. Frist: 31. Mai des Folgejahres (mit Steuerberater bis 31. Dezember).
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Einkommensteuererklärung</h4>
              <p className="text-muted-foreground">
                Persönliche Steuererklärung mit allen Einkünften. Frist: 31. Juli des Folgejahres (mit Steuerberater bis 31. Dezember).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Benachrichtigungseinstellungen</CardTitle>
            <CardDescription>Wann möchten Sie erinnert werden?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "7 Tage vor Frist", value: "7days" },
                { label: "14 Tage vor Frist", value: "14days" },
                { label: "30 Tage vor Frist", value: "30days" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-white">
              Einstellungen speichern
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
