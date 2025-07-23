import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Curators from "@/pages/curators";
import Activity from "@/pages/activity";
import NotFound from "@/pages/not-found";
import CuratorDetails from "@/pages/curator-details";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#121212] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/curators" component={Curators} />
          <Route path="/curators/:id" component={CuratorDetails} />
          <Route path="/activity" component={Activity} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
