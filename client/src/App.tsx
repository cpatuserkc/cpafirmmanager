import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Resources from "@/pages/resources";
import TimeAnalytics from "@/pages/time-analytics";
import Proposals from "@/pages/proposals";
import ExternalProposals from "@/pages/external-proposals";
import EnhancedProposals from "@/pages/enhanced-proposals";
import Clients from "@/pages/clients";
import Classification from "@/pages/classification";
import Analytics from "@/pages/analytics";
import SeasonPlanner from "@/pages/season-planner";
import Login from "@/pages/login";
import SignUp from "@/pages/signup";
import Collaborations from "@/pages/collaborations";
import ServicePackages from "@/pages/service-packages";
import TaxUpload from "@/pages/tax-upload";
import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/resources" component={Resources} />
      <Route path="/time-analytics" component={TimeAnalytics} />
      {/* Redirect from old path to new path for backward compatibility */}
      <Route path="/time-tracking">
        {() => {
          const [, navigate] = useLocation();
          useEffect(() => {
            navigate("/time-analytics");
          }, [navigate]);
          return null;
        }}
      </Route>
      <Route path="/proposals" component={Proposals} />
      <Route path="/external-proposals" component={ExternalProposals} />
      <Route path="/enhanced-proposals" component={EnhancedProposals} />
      <Route path="/clients" component={Clients} />
      <Route path="/classification" component={Classification} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/season-planner" component={SeasonPlanner} />
      <Route path="/collaborations" component={Collaborations} />
      <Route path="/service-packages" component={ServicePackages} />
      <Route path="/tax-upload" component={TaxUpload} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // User not authenticated, which is fine
        console.log('User not authenticated');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (user: User) => {
    console.log('Setting user in auth context:', user);
    setUser(user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Clear user state anyway
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider 
        value={{ 
          user, 
          isAuthenticated: !!user, 
          login, 
          logout
        }}
      >
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
