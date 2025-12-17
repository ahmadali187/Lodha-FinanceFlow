import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  Target,
  Receipt,
  CreditCard,
  TrendingUp,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "bills", label: "Bills", icon: Receipt },
  { id: "loans", label: "Loans", icon: CreditCard },
  { id: "networth", label: "Net Worth", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export function AdminSidebar({ activeSection, onSectionChange, isMobile = false }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // For mobile, always show full sidebar
  const isCollapsed = isMobile ? false : collapsed;
  const showCollapseButton = !isMobile;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className={`border-r border-border bg-card flex flex-col h-full ${isMobile ? 'w-full' : ''}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        )}
        {showCollapseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${isCollapsed ? "px-3" : ""}`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${isCollapsed ? "px-3" : ""}`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!isCollapsed && <span>Toggle Theme</span>}
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-destructive hover:text-destructive ${isCollapsed ? "px-3" : ""}`}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
