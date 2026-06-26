import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import InvoiceGenerator from "@/pages/InvoiceGenerator";
import ExpenseTracker from "@/pages/ExpenseTracker";
import SmallBusinessChecker from "@/pages/SmallBusinessChecker";
import ElsterAssistant from "@/pages/ElsterAssistant";
import VatReminders from "@/pages/VatReminders";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={InvoiceGenerator} />
      <Route path="/expenses" component={ExpenseTracker} />
      <Route path="/kleinunternehmer" component={SmallBusinessChecker} />
      <Route path="/elster" component={ElsterAssistant} />
      <Route path="/vat-reminders" component={VatReminders} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
