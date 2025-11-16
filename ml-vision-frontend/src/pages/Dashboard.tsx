import { motion } from "framer-motion";
import { Users, BookOpen, UserCheck, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studentApi, classApi, attendanceApi, AttendanceRecord } from "@/services/api";

export default function Dashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentApi.getAll,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const { data: attendanceAllToday = [], isFetching: isAttendanceLoading } = useQuery({
    queryKey: ["attendance-all-today", classes.map((c) => c.id)],
    queryFn: async () => {
      if (classes.length === 0) return [];
      const results = await Promise.all(
        classes.map(async (cls) => {
          try {
            const recs = await attendanceApi.getByClassToday(cls.id);
            return recs.map((r) => ({ ...r, className: cls.name, classId: cls.id }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: classes.length > 0,
  });

  const { data: rosterSizes = {} } = useQuery({
    queryKey: ["dashboard-roster-sizes", classes.map((c) => c.id)],
    queryFn: async () => {
      const map: Record<string, number> = {};
      for (const cls of classes) {
        try {
          const roster = await classApi.getRoster(cls.id);
          map[cls.id] = roster.length;
        } catch {
          map[cls.id] = 0;
        }
      }
      return map;
    },
    enabled: classes.length > 0,
  });

  const summary = useMemo(() => {
    const totalPresent = attendanceAllToday.filter(
      (r) => r.status?.toLowerCase?.() === "present"
    ).length;

    const uniquePresent = new Set(
      attendanceAllToday
        .filter((r) => r.status?.toLowerCase?.() === "present")
        .map((r) => r.studentId)
    ).size;

    const avgConfidence =
      totalPresent === 0
        ? 0
        : attendanceAllToday
            .filter((r) => r.status?.toLowerCase?.() === "present")
            .reduce((sum, r) => sum + r.confidence * 100, 0) / totalPresent;

    const rosterTotal = Object.values(rosterSizes || {}).reduce(
      (sum, v) => sum + (v || 0),
      0
    );
    const attendanceRate =
      rosterTotal === 0
        ? 0
        : Math.min(100, Math.round((uniquePresent / rosterTotal) * 100));

    // recent activity: most recent session
    let recent: AttendanceRecord[] = [];
    if (attendanceAllToday.length > 0) {
      // pick the session with latest sessionStartedAt or timestamp
      const sortedBySession = [...attendanceAllToday].sort((a, b) => {
        const aTime = new Date(a.sessionStartedAt || a.timestamp).getTime();
        const bTime = new Date(b.sessionStartedAt || b.timestamp).getTime();
        return bTime - aTime;
      });
      const latestSessionId = sortedBySession[0].sessionId;
      recent = sortedBySession.filter((r) => r.sessionId === latestSessionId);
    }

    return {
      totalPresent,
      uniquePresent,
      avgConfidence: Math.round(avgConfidence),
      attendanceRate,
      recent,
    };
  }, [attendanceAllToday, rosterSizes]);

  const stats = [
    { icon: Users, label: "Total Students", value: students.length.toString(), change: "" },
    { icon: BookOpen, label: "Active Classes", value: classes.length.toString(), change: "" },
    {
      icon: UserCheck,
      label: "Today's Attendance",
      value: isAttendanceLoading ? "..." : summary.totalPresent.toString(),
      change: "",
    },
    {
      icon: TrendingUp,
      label: "Attendance Rate",
      value: isAttendanceLoading ? "..." : `${summary.attendanceRate}%`,
      change: "",
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Welcome! Here's your attendance overview.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.change ? (
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isAttendanceLoading ? (
                <p className="text-center py-6 text-muted-foreground">Loading...</p>
              ) : summary.recent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Attendance history not yet available</p>
                  <p className="text-sm mt-2">Start taking attendance to see activity here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.recent.map((r: AttendanceRecord) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-foreground">{r.studentName || r.studentId}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.className} • {new Date(r.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-primary text-white"
                  size="lg"
                  onClick={() => navigate("/attendance")}
                >
                  <BookOpen className="h-5 w-5 mr-3" />
                  Start Live Attendance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => navigate("/students")}
                >
                  <Users className="h-5 w-5 mr-3" />
                  Manage Students
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => navigate("/reports")}
                >
                  <UserCheck className="h-5 w-5 mr-3" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
