import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminAccounts } from "@/components/admin/AdminAccounts";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminBudgets } from "@/components/admin/AdminBudgets";
import { AdminBills } from "@/components/admin/AdminBills";
import { AdminLoans } from "@/components/admin/AdminLoans";
import { AdminNetWorth } from "@/components/admin/AdminNetWorth";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsers />;
      case "accounts":
        return <AdminAccounts />;
      case "transactions":
        return <AdminTransactions />;
      case "budgets":
        return <AdminBudgets />;
      case "bills":
        return <AdminBills />;
      case "loans":
        return <AdminLoans />;
      case "networth":
        return <AdminNetWorth />;
      case "reports":
        return <AdminReports />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card px-4 py-3 flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar 
                activeSection={activeSection} 
                onSectionChange={handleSectionChange}
                isMobile
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${isMobile ? 'pt-14' : ''}`}>
        <div className="p-3 sm:p-6">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
