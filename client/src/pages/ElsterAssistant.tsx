import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Send, MessageCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const SUGGESTED_QUESTIONS = [
  "Wie funktioniert die Kleinunternehmerregelung nach §19 UStG?",
  "Welche Ausgaben kann ich als Freelancer absetzen?",
  "Wann muss ich eine Umsatzsteuer-Voranmeldung einreichen?",
  "Wie berechne ich meine Einkommensteuer als Freelancer?",
  "Welche Fristen gelten für die Jahreserklärung?",
  "Kann ich mein Home Office absetzen?",
  "Wie führe ich eine EÜR korrekt?",
];

export default function ElsterAssistant() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([]);

  const { data: history, isLoading: historyLoading } = trpc.elster.history.useQuery({ limit: 20 });
  const chatMutation = trpc.elster.chat.useMutation();

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      toast.error("Bitte geben Sie eine Frage ein");
      return;
    }

    const userMessage = { role: "user" as const, content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    try {
      const response = await chatMutation.mutateAsync({ question });
      const assistantMessage = { role: "assistant" as const, content: response.answer, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Fehler beim Abrufen der Antwort");
      console.error(error);
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ELSTER KI-Assistent</h1>
          <p className="text-muted-foreground mt-2">
            Stellen Sie Fragen zu deutschen Steuerthemen und erhalten Sie KI-gestützte Antworten
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="border-border h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-accent" />
                  Fragen & Antworten
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Stellen Sie eine Frage, um zu beginnen</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.role === "user"
                            ? "bg-accent text-white"
                            : "bg-muted text-foreground border border-border"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {format(msg.timestamp, "HH:mm", { locale: de })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-border p-4 space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuestion();
                      }
                    }}
                    placeholder="Stellen Sie Ihre Steuerfrage hier..."
                    className="min-h-12 resize-none"
                  />
                  <Button
                    onClick={handleSendQuestion}
                    disabled={chatMutation.isPending || !question.trim()}
                    className="bg-accent hover:bg-accent/90 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drücken Sie Enter + Shift für neue Zeile, Enter zum Senden
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Suggested Questions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  Häufige Fragen
                </CardTitle>
                <CardDescription>Klicken Sie, um eine Frage zu stellen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="w-full text-left p-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition text-foreground hover:text-accent"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="border-border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-base text-blue-900 dark:text-blue-100">ℹ️ Hinweis</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 dark:text-blue-200">
                <p>
                  Dieser KI-Assistent bietet allgemeine Informationen zu deutschen Steuerthemen. Für personalisierte
                  Steuerberatung konsultieren Sie bitte einen Steuerberater.
                </p>
              </CardContent>
            </Card>

            {/* Chat History */}
            {history && history.length > 0 && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Verlauf</CardTitle>
                  <CardDescription>Ihre letzten Fragen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-muted/50 border border-border text-sm cursor-pointer hover:bg-muted transition"
                      onClick={() => setQuestion(item.question)}
                    >
                      <p className="font-medium text-foreground truncate">{item.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
