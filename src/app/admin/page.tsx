"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShieldAlert, Flag, TrendingUp, Search, Check, X, Loader2, Crown, User, ShieldCheck, Ban } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || ['admin@jodibanao.com'];

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, reports: 0, recentSignups: 0, pendingVerifications: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !ADMIN_EMAILS.includes(session.user.email || "")) {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const loadData = async () => {
    // Fetch all profiles for user management
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("*, memberships(plan)")
      .order("created_at", { ascending: false });

    if (allUsers) setUsers(allUsers);

    // Fetch pending reports
    const { data: pendingReports } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(first_name, last_name),
        reported:profiles!reports_reported_id_fkey(first_name, last_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingReports) setReports(pendingReports);

    // Fetch pending verifications
    const { data: pendingVerifications } = await supabase
      .from("profiles")
      .select("*")
      .neq('membership_number', null)
      .neq('membership_number', '')
      .in('verification_status', ['pending', null])
      .order("created_at", { ascending: false });

    if (pendingVerifications) setVerifications(pendingVerifications);

    // Stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    setStats({
      totalUsers: allUsers?.length || 0,
      reports: pendingReports?.length || 0,
      recentSignups: allUsers?.filter(u => new Date(u.created_at) > oneWeekAgo).length || 0,
      pendingVerifications: pendingVerifications?.length || 0,
    });
  };

  const handleReport = async (id: string, action: "reviewed" | "dismissed") => {
    setReports(prev => prev.filter(r => r.id !== id));
    await supabase.from("reports").update({ status: action }).eq("id", id);
    toast.success(`Report ${action}`);
  };

  const handleVerify = async (id: string, action: "approve" | "reject", note?: string) => {
    setVerifications(prev => prev.filter(v => v.id !== id));
    
    if (action === "approve") {
      await supabase.from("profiles").update({ 
        is_verified: true, 
        verification_status: 'approved',
        verified_at: new Date().toISOString()
      }).eq("id", id);
      
      await supabase.from("notifications").insert({
        user_id: id,
        type: 'system',
        title: 'Membership Verified!',
        message: 'Your CA/CS membership has been verified by the JodiBanao admin team.',
        is_read: false
      });
      toast.success("Profile verified successfully");
    } else {
      await supabase.from("profiles").update({ 
        verification_status: 'rejected'
      }).eq("id", id);
      toast.success("Verification rejected");
    }
  };

  const handleBanToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: newStatus } : u));
    await supabase.from("profiles").update({ is_banned: newStatus }).eq("id", id);
    toast.success(newStatus ? "User banned" : "User unbanned");
  };

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.city}`.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <div className="container mx-auto px-4 max-w-7xl py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" /> Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, reports, and platform activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Pending Reports", value: stats.reports, icon: Flag, color: "text-red-500", bg: "bg-red-50" },
            { label: "Signups This Week", value: stats.recentSignups, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
            { label: "Verifications", value: stats.pendingVerifications, icon: ShieldCheck, color: "text-success", bg: "bg-emerald-50" },
          ].map(s => (
            <Card key={s.label} className="border-border shadow-sm bg-white">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`w-14 h-14 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border border-border shadow-sm rounded-xl h-auto p-1 gap-1 flex-wrap">
            <TabsTrigger value="users" className="rounded-lg flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="verifications" className="rounded-lg flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white relative">
              <ShieldCheck className="w-4 h-4" /> Verification Queue
              {verifications.length > 0 && (
                <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                  {verifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white relative">
              <Flag className="w-4 h-4" /> Reports
              {reports.length > 0 && (
                <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                  {reports.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="border-border shadow-sm bg-white">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-serif">All Users ({filteredUsers.length})</CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or city..."
                      className="pl-9 bg-muted/30 border-border"
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">City</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
                        <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.slice(0, 50).map(u => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                {u.first_name?.charAt(0) || <User className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1">
                                  {u.first_name} {u.last_name}
                                  {u.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-success" />}
                                </p>
                                <p className="text-xs text-muted-foreground">{u.profession_type || u.gender || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.city || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant={u.is_banned ? "default" : "destructive"} 
                              size="sm" 
                              onClick={() => handleBanToggle(u.id, u.is_banned)}
                              className="h-8 text-xs"
                            >
                              {u.is_banned ? "Unban" : "Ban"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="mt-6">
            <Card className="border-border shadow-sm bg-white">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-success" /> Verification Queue ({verifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {verifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20 text-success" />
                    <p>No pending verifications. All caught up! ✅</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {verifications.map(v => (
                      <div key={v.id} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {v.first_name} {v.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                            <span>Email: <span className="font-medium text-foreground">{v.email || "—"}</span></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Profession: <span className="font-medium text-foreground">{v.profession_type || "—"}</span></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Membership No: <span className="font-medium text-foreground">{v.membership_number}</span></span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">Registered: {new Date(v.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleVerify(v.id, "approve")} className="h-8 bg-success hover:bg-emerald-700 text-white gap-1">
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerify(v.id, "reject")} className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10 gap-1">
                            <X className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card className="border-border shadow-sm bg-white">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Pending Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending reports. The platform is clean! ✅</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {reports.map(r => (
                      <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            <span className="text-primary">{r.reporter?.first_name}</span> reported{" "}
                            <span className="text-destructive">{r.reported?.first_name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Reason: <span className="font-medium capitalize text-foreground">{r.reason?.replace(/_/g, " ")}</span>
                          </p>
                          {r.details && <p className="text-xs text-muted-foreground mt-1 italic">"{r.details}"</p>}
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleReport(r.id, "reviewed")} className="h-8 bg-red-600 hover:bg-red-700 text-white gap-1">
                            <Check className="w-3 h-3" /> Act
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReport(r.id, "dismissed")} className="h-8 gap-1">
                            <X className="w-3 h-3" /> Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

