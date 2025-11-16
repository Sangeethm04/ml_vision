import { motion } from "framer-motion";
import { Calendar, Download, Filter } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classApi, attendanceApi, AttendanceRecord } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClass = searchParams.get("classId") || "all";
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [isExporting, setIsExporting] = useState(false);
  const [sessionSortDirection, setSessionSortDirection] = useState<"desc" | "asc">("desc");
  const { toast } = useToast();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const { data: records = [], isFetching: isLoadingRecords } = useQuery({
    queryKey: ["reports-attendance", selectedClass],
    queryFn: async () => {
      // If "all", fetch attendance for all classes
      if (!classes || classes.length === 0) return [];

      if (selectedClass && selectedClass !== "all") {
        return attendanceApi.getByClass(selectedClass);
      }

      const all: AttendanceRecord[] = [];
      for (const cls of classes) {
        try {
          const recs = await attendanceApi.getByClass(cls.id);
          all.push(...recs);
        } catch (err) {
          console.error("Failed fetching attendance for class", cls.id, err);
        }
      }
      return all;
    },
    enabled: classes.length > 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedClass === "all") {
      params.delete("classId");
    } else {
      params.set("classId", selectedClass);
    }
    setSearchParams(params, { replace: true });
  }, [selectedClass, searchParams, setSearchParams]);

  const { data: rosterCounts = {}, isFetching: isLoadingRosters } = useQuery({
    queryKey: ["report-roster-counts", selectedClass],
    queryFn: async () => {
      const target =
        selectedClass && selectedClass !== "all"
          ? classes.filter((c) => c.id === selectedClass)
          : classes;

      const map: Record<string, number> = {};
      for (const cls of target) {
        try {
          const roster = await classApi.getRoster(cls.id);
          map[cls.id] = roster.length;
        } catch (err) {
          console.error("Failed fetching roster for class", cls.id, err);
          map[cls.id] = 0;
        }
      }
      return map;
    },
    enabled: classes.length > 0,
  });

  const summary = useMemo(() => {
    if (!records.length)
      return {
        total: 0,
        byClass: [] as { classId: string; count: number; name: string }[],
        sessions: [] as { id: string; startedAt: string; records: AttendanceRecord[] }[],
      };

    const byClassMap = new Map<string, { classId: string; name: string; count: number }>();
    const sessionsMap = new Map<string, { id: string; startedAt: string; records: AttendanceRecord[] }>();
    records.forEach((r) => {
      if (!byClassMap.has(r.classId)) {
        byClassMap.set(r.classId, { classId: r.classId, name: r.className, count: 0 });
      }
      byClassMap.get(r.classId)!.count += 1;

      if (!r.sessionId) return;
      if (!sessionsMap.has(r.sessionId)) {
        sessionsMap.set(r.sessionId, {
          id: r.sessionId,
          startedAt: r.sessionStartedAt || r.timestamp,
          records: [],
        });
      }
      sessionsMap.get(r.sessionId)!.records.push(r);
    });

    const sessions = Array.from(sessionsMap.values()).sort((a, b) => {
      const diff = new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime();
      return sessionSortDirection === "asc" ? diff : -diff;
    });

    return {
      total: records.length,
      byClass: Array.from(byClassMap.values()),
      sessions,
    };
  }, [records, sessionSortDirection]);

  const averageAttendance = useMemo(() => {
    const targetIds =
      selectedClass && selectedClass !== "all"
        ? [selectedClass]
        : Object.keys(rosterCounts);

    if (targetIds.length === 0) return null;

    let rosterSum = 0;
    let attendedSum = 0;

    targetIds.forEach((id) => {
      const rosterSize = rosterCounts[id] ?? 0;
      rosterSum += rosterSize;

      const uniquePresent = new Set(
        records
          .filter(
            (r) =>
              r.classId === id &&
              (r.status?.toLowerCase?.() === "present" || r.status?.toLowerCase?.() === "present".toLowerCase())
          )
          .map((r) => r.studentId)
      ).size;
      attendedSum += uniquePresent;
    });

    if (rosterSum === 0) return null;
    return (attendedSum / rosterSum) * 100;
  }, [records, rosterCounts, selectedClass]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const targetClasses =
        selectedClass && selectedClass !== "all"
          ? classes.filter((c) => c.id === selectedClass)
          : classes;

      let rows: AttendanceRecord[] = [];
      for (const cls of targetClasses) {
        try {
          const recs = await attendanceApi.getByClass(cls.id);
          rows = rows.concat(recs);
        } catch (err) {
          console.error("Failed to fetch attendance for class", cls.id, err);
        }
      }

      if (rows.length === 0) {
        toast({ title: "No attendance data to export", variant: "destructive" });
        return;
      }

      const header = [
        "Class Name",
        "Class Code",
        "Student Name",
        "Student External ID",
        "Timestamp",
        "Confidence",
        "Session",
      ];
      const csv = [
        header.join(","),
        ...rows.map((r) =>
          [
            `"${r.className}"`,
            r.classId,
            `"${r.studentName}"`,
            r.studentExternalId,
            r.timestamp,
            r.confidence,
            r.sessionId || "",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename =
        selectedClass && selectedClass !== "all"
          ? `attendance_${selectedClass}.csv`
          : "attendance_all_classes.csv";
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Exported attendance report" });
    } catch (err) {
      toast({ title: "Failed to export report", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">View attendance reports and analytics</p>
        </div>
        <Button
          className="bg-gradient-primary text-white shadow-elegant hover:opacity-90"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Date Range</p>
                <Select defaultValue="week">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Calendar className="h-8 w-8 text-primary ml-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Filter by Class</p>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Filter className="h-8 w-8 text-secondary ml-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {averageAttendance !== null ? `${averageAttendance.toFixed(0)}%` : "—"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Average Attendance</p>
              <p className="text-xs text-muted-foreground mt-2">
                {isLoadingRosters
                  ? "Loading roster..."
                  : "Computed from unique attendees / roster"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecords ? (
              <p className="text-muted-foreground text-center py-6">Loading attendance...</p>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No attendance records available yet</p>
                <p className="text-sm mt-2">Attendance history will appear once you start taking attendance</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Total records: {summary.total}
                  </span>
                  {summary.byClass.map((c) => (
                    <span key={c.classId}>
                      {c.name}: {c.count}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs uppercase tracking-wide text-foreground/70">
                    Session sort
                  </span>
                  <Select
                    value={sessionSortDirection}
                    onValueChange={(value: "asc" | "desc") => setSessionSortDirection(value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest first</SelectItem>
                      <SelectItem value="asc">Oldest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {summary.sessions.length === 0 && (
                    <div className="text-muted-foreground text-sm">
                      No sessions found (records missing session ids)
                    </div>
                  )}

                  {summary.sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                        <span>
                          Session {session.id.slice(0, 8)} —{" "}
                          {new Date(session.startedAt).toLocaleString()}
                        </span>
                        <span>{session.records.length} record(s)</span>
                      </div>

                      <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-4 py-2">Class</th>
                              <th className="text-left px-4 py-2">Student</th>
                              <th className="text-left px-4 py-2">Timestamp</th>
                              <th className="text-left px-4 py-2">Status</th>
                              <th className="text-right px-4 py-2">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.records
                              .slice()
                              .sort(
                                (a, b) =>
                                  new Date(b.timestamp).getTime() -
                                  new Date(a.timestamp).getTime()
                              )
                              .map((r) => (
                                <tr key={r.id} className="border-t">
                                  <td className="px-4 py-2">{r.className}</td>
                                  <td className="px-4 py-2">{r.studentName}</td>
                                  <td className="px-4 py-2">
                                    {new Date(r.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 capitalize">
                                    {r.status?.toLowerCase()}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {(r.confidence * 100).toFixed(0)}%
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
