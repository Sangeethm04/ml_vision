import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { navItems } from "./AppSidebar";
import { Camera } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
        <div className="md:hidden border-b border-border bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">Vision</span>
                <span className="text-xs text-muted-foreground">
                  Attendance Tracker
                </span>
              </div>
            </div>
            <Select
              value={
                navItems.find((i) => location.pathname.startsWith(i.url))?.url ||
                "/"
              }
              onValueChange={(val) => navigate(val)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Navigate" />
              </SelectTrigger>
              <SelectContent>
                {navItems.map((item) => (
                  <SelectItem key={item.url} value={item.url}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto px-3 pb-6 md:px-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
