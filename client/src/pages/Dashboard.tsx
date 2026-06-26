import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Euro, TrendingUp, FileText, AlertCircle, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const ACCENT_COLOR = "oklch(0.42 0.21 35)"; // Amber-Gold

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: upcomingReminders, isLoading: remindersLoading } = trpc.vatReminders.upcoming.useQuery({ daysAhead: 90 });

  if (!user) return null;

  const formatEuro = (amount: number | null | undefined) => {
    if (!amount) return "€0,00";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
  };

  // KPI Cards
  const kpiCards = [
    {
      title: "Gesamtumsatz",
      value: formatEuro(stats?.totalRevenue),
      icon: Euro,
      color: "text-accent",
      description: "Dieses Jahr",
    },
    {
      title: "Ausgaben",
      value: formatEuro(stats?.totalExpenses),
      icon: TrendingUp,
      color: "text-red-600 dark:text-red-400",
      description: "Gesamt",
    },
    {
      title: "Gewinn",
      value: formatEuro(stats?.profit),
      icon: FileText,
      color: "text-green-600 dark:text-green-400",
      description: "Nach Ausgaben",
    },
    {
      title: "Offene Rechnungen",
      value: formatEuro(stats?.openAmount),
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      description: `${stats?.openInvoices} Rechnungen`,
    },
  ];

  // Monthly revenue chart data
  const monthlyData = [
    { month: "Jan", revenue: 3200, expenses: 1200 },
    { month: "Feb", revenue: 2800, expenses: 1100 },
    { month: "Mär", revenue: 4100, expenses: 1300 },
    { month: "Apr", revenue: 3900, expenses: 1250 },
    { month: "Mai", revenue: 4500, expenses: 1400 },
    { month: "Jun", revenue: 4200, expenses: 1350 },
  ];

  // Expense categories pie chart
  const expenseCategoriesData = [
    { name: "Software", value: 450, color: "oklch(0.42 0.21 35)" },
    { name: "Büro", value: 320, color: "oklch(0.55 0.15 45)" },
    { name: "Reise", value: 280, color: "oklch(0.65 0.10 55)" },
    { name: "Versicherung", value: 200, color: "oklch(0.75 0.08 65)" },
    { name: "Sonstiges", value: 150, color: "oklch(0.85 0.05 75)" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Willkommen, {user.name || "Freelancer"}!</h1>
          <p className="text-muted-foreground mt-2">Hier ist ein Überblick über Ihre Geschäftstätigkeit.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Expenses Chart */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle>Umsatz vs. Ausgaben</CardTitle>
              <CardDescription>Monatlicher Vergleich</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--card)", 
                      border: "1px solid var(--border)",
                      color: "var(--foreground)"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="var(--primary)" name="Umsatz" />
                  <Bar dataKey="expenses" fill="var(--destructive)" name="Ausgaben" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Ausgabenkategorien</CardTitle>
              <CardDescription>Verteilung</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategoriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: €${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--card)", 
                      border: "1px solid var(--border)",
                      color: "var(--foreground)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tax Deadlines */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Anstehende Steuerfälligkeiten
                </CardTitle>
                <CardDescription>Nächste 90 Tage</CardDescription>
              </div>
              <Button variant="outline" size="sm">Alle anzeigen</Button>
            </div>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : upcomingReminders && upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {reminder.type === "voranmeldung" && "Umsatzsteuer-Voranmeldung"}
                          {reminder.type === "jahreserklarung" && "Jahreserklärung"}
                          {reminder.type === "einkommensteuererklarung" && "Einkommensteuererklärung"}
                          {reminder.type === "custom" && "Benutzerdefiniert"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fällig: {format(new Date(reminder.dueDate), "d. MMMM yyyy", { locale: de })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {reminder.completed ? (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          Erledigt
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                          Ausstehend
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Keine anstehenden Fälligkeiten in den nächsten 90 Tagen</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border hover:border-accent/50 transition cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Neue Rechnung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Erstellen Sie eine neue Rechnung für einen Kunden</p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">Rechnung erstellen</Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-accent/50 transition cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ausgabe erfassen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Erfassen Sie eine neue Geschäftsausgabe</p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">Ausgabe hinzufügen</Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-accent/50 transition cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kontakt hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Verwalten Sie Ihre Kundenkontakte</p>
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">Kontakt erstellen</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
