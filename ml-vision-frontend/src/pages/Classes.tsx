import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import { format } from "date-fns";
import { attendanceApi, classApi, studentApi, AttendanceRecord, Class, Student } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Classes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedAttendanceClass, setSelectedAttendanceClass] =
    useState<Class | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [rosterTargetClass, setRosterTargetClass] = useState<Class | null>(null);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>("");
  const [sessionSortDirection, setSessionSortDirection] = useState<
    "desc" | "asc"
  >("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: classes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await classApi.getAll();

      // Support both raw array or wrapped response
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;

      console.warn("Unexpected classApi.getAll() response:", res);
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", code: "", description: "" });
      toast({ title: "Class created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const filteredClasses = classes.filter((cls: Class) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    data: attendanceRecords = [],
    isFetching: isAttendanceLoading,
  } = useQuery({
    queryKey: ["attendance", selectedAttendanceClass?.id],
    queryFn: () => attendanceApi.getByClass(selectedAttendanceClass!.id),
    enabled: !!selectedAttendanceClass,
  });

  const { data: roster = [], isFetching: isRosterLoading } = useQuery({
    queryKey: ["roster", selectedAttendanceClass?.id],
    queryFn: () => classApi.getRoster(selectedAttendanceClass!.id),
    enabled: !!selectedAttendanceClass,
  });

  const rosterCounts = useQueries({
    queries: classes.map((cls) => ({
      queryKey: ["roster-count", cls.id],
      queryFn: () => classApi.getRoster(cls.id),
      enabled: classes.length > 0,
    })),
  });

  const { data: rosterManageList = [], isFetching: isRosterManageLoading } = useQuery({
    queryKey: ["roster", rosterTargetClass?.id, "manage"],
    queryFn: () => classApi.getRoster(rosterTargetClass!.id),
    enabled: !!rosterTargetClass && rosterDialogOpen,
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentApi.getAll,
    enabled: rosterDialogOpen,
  });

  const addToRosterMutation = useMutation({
    mutationFn: (studentExternalId: string) =>
      classApi.addToRoster(rosterTargetClass!.id, studentExternalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", rosterTargetClass?.id, "manage"] });
      setSelectedStudentToAdd("");
      toast({ title: "Student added to class" });
    },
    onError: () => toast({ title: "Failed to add student", variant: "destructive" }),
  });

  const removeFromRosterMutation = useMutation({
    mutationFn: (studentExternalId: string) =>
      classApi.removeFromRoster(rosterTargetClass!.id, studentExternalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", rosterTargetClass?.id, "manage"] });
      toast({ title: "Student removed from class" });
    },
    onError: () => toast({ title: "Failed to remove student", variant: "destructive" }),
  });

  const handleOpenAttendance = (cls: Class) => {
    navigate(`/reports?classId=${cls.id}`);
  };

  const handleCloseAttendance = () => {
    setAttendanceDialogOpen(false);
    setSelectedAttendanceClass(null);
    setSelectedSessionId(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const openRosterDialog = (cls: Class) => {
    setRosterTargetClass(cls);
    setRosterDialogOpen(true);
  };

  const closeRosterDialog = () => {
    setRosterDialogOpen(false);
    setRosterTargetClass(null);
    setSelectedStudentToAdd("");
  };

  const { sessionOptions, filteredRecords, groupedSessions } = useMemo(() => {
    const grouped = attendanceRecords.reduce(
      (
        acc: Record<
          string,
          { startedAt: string; records: AttendanceRecord[] }
        >,
        record
      ) => {
        if (!record.sessionId) return acc;
        if (!acc[record.sessionId]) {
          acc[record.sessionId] = {
            startedAt: record.sessionStartedAt || record.timestamp,
            records: [],
          };
        }
        acc[record.sessionId].records.push(record);
        return acc;
      },
      {}
    );

    const options = [
      { id: "all", startedAt: "" },
      ...Object.entries(grouped).map(([id, value]) => ({
        id,
        startedAt: value.startedAt,
      })),
    ];

    const sortedOptions = options
      .filter((o) => o.id !== "all")
      .sort((a, b) => {
        const diff =
          new Date(a.startedAt || 0).getTime() -
          new Date(b.startedAt || 0).getTime();
        return sessionSortDirection === "asc" ? diff : -diff;
      });

    const finalOptions = [
      options.find((o) => o.id === "all")!,
      ...sortedOptions,
    ];

    const effectiveId =
      selectedSessionId && selectedSessionId !== "all"
        ? selectedSessionId
        : "all";

    const filtered =
      effectiveId === "all"
        ? attendanceRecords
        : grouped[effectiveId]?.records || [];

    const groupedSessions = finalOptions
      .filter((o) => o.id !== "all")
      .map((o) => ({
        id: o.id,
        startedAt: o.startedAt,
        records: grouped[o.id]?.records || [],
      }));

    return {
      sessionOptions: finalOptions,
      filteredRecords: filtered,
      groupedSessions,
    };
  }, [attendanceRecords, selectedSessionId, sessionSortDirection]);

  const rosterCount = roster?.length ?? 0;
  const uniqueAttendees = new Set(
    filteredRecords.map((record: AttendanceRecord) => record.studentId)
  ).size;
  const attendanceRatio = rosterCount
    ? `${uniqueAttendees}/${rosterCount} (${Math.round(
        (uniqueAttendees / rosterCount) * 100
      )}%)`
    : "N/A";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Classes
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage classes and student rosters
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white shadow-elegant hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  placeholder="Intro to AI"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classCode">Class Code</Label>
                <Input
                  id="classCode"
                  placeholder="CS101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Machine learning fundamentals"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card className="border-border shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes by name or code..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading classes...
        </div>
      )}

      {/* Error Handling */}
      {isError && (
        <div className="text-center py-12 text-red-500">
          Failed to load classes: {error instanceof Error && error.message}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredClasses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No classes found
        </div>
      )}

      {/* Classes Grid */}
      {!isLoading && !isError && filteredClasses.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredClasses.map((cls: Class, index: number) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader className="bg-gradient-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{cls.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {cls.code}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {cls.description && (
                    <p className="text-sm text-muted-foreground">
                      {cls.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {(() => {
                        const match = rosterCounts.find(
                          (q) => q.data && q.queryKey?.[1] === cls.id
                        );
                        if (match?.isLoading) return "Loading roster...";
                        if (match?.data) return `${match.data.length} enrolled`;
                        return "Roster unavailable";
                      })()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openRosterDialog(cls)}
                    >
                      Manage Roster
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-primary text-white"
                      onClick={() => handleOpenAttendance(cls)}
                    >
                      View Attendance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={attendanceDialogOpen} onOpenChange={handleCloseAttendance}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Attendance{" "}
              {selectedAttendanceClass
                ? `for ${selectedAttendanceClass.name}`
                : ""}
            </DialogTitle>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  Attendees: {uniqueAttendees}
                  {rosterCount ? ` / ${rosterCount}` : ""} ({attendanceRatio})
                </span>
                {(isAttendanceLoading || isRosterLoading) && (
                  <span className="text-xs text-primary">Refreshing...</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-foreground/70">
                  Session
                </span>
                <Select
                  value={selectedSessionId}
                  onValueChange={(value) =>
                    setSelectedSessionId(value)
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionOptions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.id === "all"
                          ? "All sessions"
                          : `${format(
                              new Date(session.startedAt),
                              "PPpp"
                            )} (${session.id.slice(0, 8)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sessionSortDirection}
                  onValueChange={(value: "asc" | "desc") =>
                    setSessionSortDirection(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          {(isAttendanceLoading || isRosterLoading) && <LinearProgress />}

          <div className="mt-4">
            {filteredRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No attendance records yet for this class.
              </p>
            ) : selectedSessionId === "all" ? (
              <div className="space-y-6">
                {groupedSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                      <span>
                        Session {session.id.slice(0, 8)} —{" "}
                        {format(new Date(session.startedAt), "PPpp")}
                      </span>
                      <span>{session.records.length} record(s)</span>
                    </div>
                    <TableContainer component={Paper} className="shadow-none">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Recorded At</TableCell>
                            <TableCell align="right">Confidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {session.records
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(b.timestamp).getTime() -
                                new Date(a.timestamp).getTime()
                            )
                            .map((record: AttendanceRecord) => (
                              <TableRow key={record.id} hover>
                                <TableCell>{record.studentName}</TableCell>
                                <TableCell>{record.className}</TableCell>
                                <TableCell>
                                  {format(new Date(record.timestamp), "PPpp")}
                                </TableCell>
                                <TableCell align="right">
                                  {(record.confidence * 100).toFixed(0)}%
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                ))}
              </div>
            ) : (
              <TableContainer component={Paper} className="shadow-none">
                <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Recorded At</TableCell>
                        <TableCell align="right">Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRecords.map((record: AttendanceRecord) => (
                        <TableRow key={record.id} hover>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell>{record.className}</TableCell>
                          <TableCell className="capitalize">
                            {record.status?.toLowerCase()}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.timestamp), "PPpp")}
                          </TableCell>
                          <TableCell align="right">
                            {(record.confidence * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rosterDialogOpen} onOpenChange={closeRosterDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Roster{" "}
              {rosterTargetClass ? `— ${rosterTargetClass.name}` : ""}
            </DialogTitle>
          </DialogHeader>

          {isRosterManageLoading && <LinearProgress />}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={selectedStudentToAdd}
                onValueChange={setSelectedStudentToAdd}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student to add" />
                </SelectTrigger>
                <SelectContent>
                  {allStudents.map((s: Student) => (
                    <SelectItem key={s.id} value={s.externalId}>
                      {s.firstName} {s.lastName} ({s.externalId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  selectedStudentToAdd && addToRosterMutation.mutate(selectedStudentToAdd)
                }
                disabled={!selectedStudentToAdd || addToRosterMutation.isPending}
                className="bg-gradient-primary text-white"
              >
                {addToRosterMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>

            <TableContainer component={Paper} className="shadow-none">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>External ID</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rosterManageList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <span className="text-muted-foreground">No students in roster</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rosterManageList.map((student: Student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.externalId}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              removeFromRosterMutation.mutate(student.externalId)
                            }
                            disabled={removeFromRosterMutation.isPending}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
