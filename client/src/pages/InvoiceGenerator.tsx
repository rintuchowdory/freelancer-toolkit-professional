import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
}

export default function InvoiceGenerator() {
  const { user } = useAuth();
  const [isKleinunternehmer, setIsKleinunternehmer] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit: "Stunde", unitPrice: 0, taxRate: isKleinunternehmer ? 0 : 19 },
  ]);

  const createInvoiceMutation = trpc.invoices.create.useMutation();

  const addLineItem = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setLineItems([
      ...lineItems,
      { id: newId, description: "", quantity: 1, unit: "Stunde", unitPrice: 0, taxRate: isKleinunternehmer ? 0 : 19 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    } else {
      toast.error("Mindestens ein Leistungsposten ist erforderlich");
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    if (isKleinunternehmer) return 0;
    return lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * item.taxRate) / 100;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = subtotal + tax;

  const handleCreateInvoice = async () => {
    if (!clientName) {
      toast.error("Kundennamen erforderlich");
      return;
    }

    if (lineItems.some((item) => !item.description || item.unitPrice <= 0)) {
      toast.error("Alle Leistungspositionen müssen vollständig ausgefüllt sein");
      return;
    }

    try {
      const invoiceNumber = `RE-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
      const issueDate = new Date();
      const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      await createInvoiceMutation.mutateAsync({
        number: invoiceNumber,
        clientName,
        clientEmail: clientEmail || undefined,
        clientTaxId: clientTaxId || undefined,
        senderName: user?.name || "Freelancer",
        issueDate,
        dueDate,
        subtotal: subtotal.toFixed(2),
        taxAmount: tax.toFixed(2),
        total: total.toFixed(2),
        isKleinunternehmer,
        lineItems,
      });

      toast.success("Rechnung erstellt!");
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientTaxId("");
      setLineItems([
        { id: "1", description: "", quantity: 1, unit: "Stunde", unitPrice: 0, taxRate: isKleinunternehmer ? 0 : 19 },
      ]);
    } catch (error) {
      toast.error("Fehler beim Erstellen der Rechnung");
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rechnungsgenerator</h1>
          <p className="text-muted-foreground mt-2">Erstellen Sie professionelle Rechnungen mit §14 UStG-Compliance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kleinunternehmer Toggle */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Rechnungstyp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Kleinunternehmer (§19 UStG)</p>
                    <p className="text-sm text-muted-foreground">Keine Umsatzsteuer ausweisen</p>
                  </div>
                  <Switch checked={isKleinunternehmer} onCheckedChange={setIsKleinunternehmer} />
                </div>
                {isKleinunternehmer && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ℹ️ Als Kleinunternehmer nach §19 UStG werden keine Steuersätze berechnet. Der Gesamtbetrag entspricht dem Nettobetrag.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Kundendaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Kundenname *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="z.B. Max Mustermann GmbH"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">E-Mail</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="kunde@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="clientTaxId">Steuernummer / USt-IdNr.</Label>
                  <Input
                    id="clientTaxId"
                    value={clientTaxId}
                    onChange={(e) => setClientTaxId(e.target.value)}
                    placeholder="z.B. DE123456789"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Leistungspositionen</CardTitle>
                  <Button onClick={addLineItem} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={item.id} className="p-4 border border-border rounded-lg space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Position {idx + 1}</span>
                      {lineItems.length > 1 && (
                        <Button
                          onClick={() => removeLineItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs">Beschreibung *</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="z.B. Webentwicklung - 5 Tage"
                        className="mt-1 min-h-12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Menge *</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Einheit</Label>
                        <Select value={item.unit} onValueChange={(value) => updateLineItem(item.id, "unit", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Stunde">Stunde</SelectItem>
                            <SelectItem value="Tag">Tag</SelectItem>
                            <SelectItem value="Woche">Woche</SelectItem>
                            <SelectItem value="Monat">Monat</SelectItem>
                            <SelectItem value="Projekt">Projekt</SelectItem>
                            <SelectItem value="Stück">Stück</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Einzelpreis (€) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Steuersatz (%)</Label>
                        <Select
                          value={item.taxRate.toString()}
                          onValueChange={(value) => updateLineItem(item.id, "taxRate", parseFloat(value))}
                          disabled={isKleinunternehmer}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Keine USt)</SelectItem>
                            <SelectItem value="7">7% (Ermäßigt)</SelectItem>
                            <SelectItem value="19">19% (Normal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Zwischensumme: <span className="font-mono font-semibold text-foreground">€{(item.quantity * item.unitPrice).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card className="border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nettobetrag:</span>
                    <span className="font-mono font-semibold">€{subtotal.toFixed(2)}</span>
                  </div>
                  {!isKleinunternehmer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Umsatzsteuer (19%):</span>
                      <span className="font-mono font-semibold">€{tax.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Gesamtbetrag:</span>
                  <span className="text-2xl font-mono font-bold text-accent">€{total.toFixed(2)}</span>
                </div>

                {isKleinunternehmer && (
                  <Badge variant="outline" className="w-full justify-center bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    Kleinunternehmer - Keine USt
                  </Badge>
                )}

                <div className="pt-4 space-y-2">
                  <Button onClick={handleCreateInvoice} className="w-full bg-accent hover:bg-accent/90 text-white" disabled={createInvoiceMutation.isPending}>
                    {createInvoiceMutation.isPending ? "Wird erstellt..." : "Rechnung erstellen"}
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Eye className="w-4 h-4" />
                    Vorschau
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Als PDF exportieren
                  </Button>
                </div>

                {/* §14 UStG Compliance Info */}
                <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">§14 UStG Compliance</p>
                  <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                    <li>✓ Rechnungsnummer eindeutig</li>
                    <li>✓ Ausstellungs- und Leistungsdatum</li>
                    <li>✓ Leistungsbeschreibung</li>
                    <li>✓ Steuersätze und Beträge</li>
                    <li>✓ Zahlungsbedingungen</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
