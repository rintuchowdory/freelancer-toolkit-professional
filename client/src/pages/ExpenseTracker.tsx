import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const EXPENSE_CATEGORIES = [
  { id: "buero", label: "Büro & Ausstattung", deductible: 100 },
  { id: "software", label: "Software & Lizenzen", deductible: 100 },
  { id: "reise", label: "Reisekosten", deductible: 100 },
  { id: "weiterbildung", label: "Weiterbildung & Kurse", deductible: 100 },
  { id: "kommunikation", label: "Kommunikation (Tel, Internet)", deductible: 100 },
  { id: "marketing", label: "Marketing & Werbung", deductible: 100 },
  { id: "versicherung", label: "Versicherungen", deductible: 100 },
  { id: "steuerberatung", label: "Steuerberatung & Buchhaltung", deductible: 100 },
  { id: "homeoffice", label: "Home Office (anteilig)", deductible: 50 },
  { id: "sonstiges", label: "Sonstiges", deductible: 100 },
];

export default function ExpenseTracker() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("software");
  const [deductiblePercentage, setDeductiblePercentage] = useState(100);
  const [receipt, setReceipt] = useState(false);

  const { data: expenses, isLoading: expensesLoading, refetch } = trpc.expenses.list.useQuery();
  const createExpenseMutation = trpc.expenses.create.useMutation();

  const handleCreateExpense = async () => {
    if (!description || !amount) {
      toast.error("Bitte alle erforderlichen Felder ausfüllen");
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        date: new Date(date),
        description,
        amount,
        category,
        deductiblePercentage,
        receipt,
      });

      toast.success("Ausgabe erfasst!");
      setDescription("");
      setAmount("");
      setCategory("software");
      setDeductiblePercentage(100);
      setReceipt(false);
      refetch();
    } catch (error) {
      toast.error("Fehler beim Erfassen der Ausgabe");
      console.error(error);
    }
  };

  // Calculate statistics
  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const totalDeductible = expenses?.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) * exp.deductiblePercentage / 100), 0) || 0;

  // Group by category
  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => {
    const categoryExpenses = expenses?.filter((exp) => exp.category === cat.id) || [];
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    const deductible = categoryExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) * exp.deductiblePercentage / 100), 0);
    return {
      name: cat.label,
      value: total,
      deductible,
      count: categoryExpenses.length,
    };
  }).filter((cat) => cat.value > 0);

  // Monthly breakdown
  const monthlyData = [
    { month: "Jan", expenses: 450, deductible: 400 },
    { month: "Feb", expenses: 380, deductible: 340 },
    { month: "Mär", expenses: 520, deductible: 480 },
    { month: "Apr", expenses: 410, deductible: 380 },
    { month: "Mai", expenses: 600, deductible: 550 },
    { month: "Jun", expenses: 480, deductible: 450 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ausgabenverfolgung</h1>
          <p className="text-muted-foreground mt-2">Erfassen und kategorisieren Sie Ihre Geschäftsausgaben für die EÜR</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtausgaben</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">€{totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{expenses?.length || 0} Einträge</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Abzugsfähig</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">€{totalDeductible.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{((totalDeductible / totalExpenses) * 100 || 0).toFixed(0)}% der Ausgaben</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nicht abzugsfähig</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">€{(totalExpenses - totalDeductible).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Privatausgaben</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Expense Form */}
          <div className="lg:col-span-1">
            <Card className="border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Neue Ausgabe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Beschreibung *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="z.B. Adobe Creative Cloud Lizenz"
                    className="mt-1 min-h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Betrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deductible">Abzugsfähigkeit (%)</Label>
                  <Input
                    id="deductible"
                    type="number"
                    min="0"
                    max="100"
                    value={deductiblePercentage}
                    onChange={(e) => setDeductiblePercentage(parseInt(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Abzugsfähiger Betrag: €{((parseFloat(amount) * deductiblePercentage) / 100).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <input
                    type="checkbox"
                    id="receipt"
                    checked={receipt}
                    onChange={(e) => setReceipt(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="receipt" className="text-sm cursor-pointer">
                    Beleg vorhanden
                  </Label>
                </div>

                <Button
                  onClick={handleCreateExpense}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? "Wird erfasst..." : "Ausgabe erfassen"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Breakdown */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Monatlicher Verlauf
                </CardTitle>
                <CardDescription>Ausgaben vs. abzugsfähige Beträge</CardDescription>
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
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expenses" fill="var(--destructive)" name="Gesamtausgaben" />
                    <Bar dataKey="deductible" fill="var(--accent)" name="Abzugsfähig" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Ausgaben nach Kategorie</CardTitle>
                <CardDescription>Verteilung der Ausgaben</CardDescription>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: €${value.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={[
                              "oklch(0.42 0.21 35)",
                              "oklch(0.55 0.15 45)",
                              "oklch(0.65 0.10 55)",
                              "oklch(0.75 0.08 65)",
                              "oklch(0.85 0.05 75)",
                            ][index % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Keine Ausgaben erfasst</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Expenses Table */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Letzte Ausgaben</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    EÜR exportieren
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Wird geladen...</p>
                  </div>
                ) : expenses && expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead>Kategorie</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                          <TableHead className="text-right">Abzugsfähig</TableHead>
                          <TableHead>Beleg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.slice(0, 10).map((expense) => {
                        const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.id === expense.category)?.label || expense.category;
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(expense.date), "dd.MM.yyyy", { locale: de })}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{categoryLabel}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">€{expense.amount.toString()}</TableCell>
                            <TableCell className="text-right font-mono text-accent">
                              €{((parseFloat(expense.amount.toString()) * expense.deductiblePercentage) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>{expense.receipt ? "✓" : "−"}</TableCell>
                          </TableRow>
                        );
                      })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Keine Ausgaben erfasst</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
