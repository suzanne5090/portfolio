import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import ProfileTab from "@/components/admin/ProfileTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import ProjectsTab from "@/components/admin/ProjectsTab";
import MessagesTab from "@/components/admin/MessagesTab";
import { LogOut, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("projects");

  const onLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-white" data-testid="admin-dashboard">
      {/* Top bar */}
      <header className="border-b border-[#E1E3E8] sticky top-0 bg-white z-30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display font-black text-lg tracking-tighter">
              SUZANNE<span className="text-[#7BC4C4]">.</span>
            </Link>
            <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 hidden sm:inline">
              Control Room
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-neutral-300 px-3 py-1.5 hover:bg-[#0A0B10] hover:text-white transition-colors"
              data-testid="view-site-link"
            >
              View site <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="hidden sm:inline text-xs text-neutral-500">{user?.email}</span>
            <button
              onClick={onLogout}
              data-testid="logout-btn"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-neutral-300 px-3 py-1.5 hover:bg-[#7BC4C4] hover:text-white hover:border-[#7BC4C4] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display font-black uppercase text-4xl sm:text-5xl tracking-tighter">
              Dashboard
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Manage everything visitors see on your portfolio.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-none border border-[#E1E3E8] bg-white p-0 h-auto">
            <TabsTrigger
              value="projects"
              data-testid="tab-projects"
              className="rounded-none data-[state=active]:bg-[#0A0B10] data-[state=active]:text-white text-[11px] tracking-[0.2em] uppercase py-3"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              data-testid="tab-categories"
              className="rounded-none data-[state=active]:bg-[#0A0B10] data-[state=active]:text-white text-[11px] tracking-[0.2em] uppercase py-3"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              data-testid="tab-profile"
              className="rounded-none data-[state=active]:bg-[#0A0B10] data-[state=active]:text-white text-[11px] tracking-[0.2em] uppercase py-3"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              data-testid="tab-messages"
              className="rounded-none data-[state=active]:bg-[#0A0B10] data-[state=active]:text-white text-[11px] tracking-[0.2em] uppercase py-3"
            >
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-8"><ProjectsTab /></TabsContent>
          <TabsContent value="categories" className="mt-8"><CategoriesTab /></TabsContent>
          <TabsContent value="profile" className="mt-8"><ProfileTab /></TabsContent>
          <TabsContent value="messages" className="mt-8"><MessagesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
