import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { studentApi, Student, classApi, Class } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // roster management state
  const [roster, setRoster] = useState<Class[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    externalId: "",
    email: "",
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // LOAD STUDENTS
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentApi.getAll,
  });

  // CREATE STUDENT
  const createMutation = useMutation({
    mutationFn: studentApi.createWithPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsAddDialogOpen(false);
      setFormData({ firstName: "", lastName: "", externalId: "", email: "" });
      setPhotoFile(null);
      toast({ title: "Student created successfully" });
    },
    onError: () => toast({ title: "Failed to create student", variant: "destructive" }),
  });

  // EDIT STUDENT
  const editMutation = useMutation({
    mutationFn: (fd: FormData) => studentApi.updateWithPhoto(selectedStudent!.id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsEditDialogOpen(false);
      toast({ title: "Student updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const filteredStudents = students.filter((s: Student) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.externalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------- ADD STUDENT SUBMIT --------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append("photo", photoFile);

    createMutation.mutate(fd);
  };

  // -------- EDIT STUDENT SUBMIT --------
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append("photo", photoFile);

    editMutation.mutate(fd);
  };

  // -------- VIEW ROLES --------
  const openViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileDialogOpen(true);
  };

  // -------- EDIT STUDENT --------
  const openEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      externalId: student.externalId,
      email: student.email,
    });
    setPhotoFile(null);
    setIsEditDialogOpen(true);
  };

  // -------- ROSTER MANAGEMENT --------
  const openManageRoster = async (student: Student) => {
    setSelectedStudent(student);
    setIsRosterDialogOpen(true);

    const cls = await classApi.getAll();
    setAllClasses(cls);

    const enrolled: Class[] = [];

    for (const c of cls) {
      try {
        const roster = await classApi.getRoster(c.id);
        if (roster.some((s) => s.id === student.id)) {
          enrolled.push(c);
        }
      } catch {
        /* safe ignore */
      }
    }

    setRoster(enrolled);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-muted-foreground mt-2">Manage student profiles & enrollments</p>
        </div>

        {/* ADD STUDENT */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white shadow-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />

              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />

              <Label>Student ID</Label>
              <Input
                value={formData.externalId}
                onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                required
              />

              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
                required
              />

              <Label>Photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />

              <Button
                type="submit"
                className="w-full bg-gradient-primary text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Add Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BAR */}
      <Card className="border-border shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input
              placeholder="Search by name or student ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* STUDENT GRID */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader className="bg-gradient-card">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-primary overflow-hidden">
                      <AvatarImage
                        src={`${API_BASE}${s.photoUrl}`}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback>{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                    </Avatar>

                    <div>
                      <CardTitle>{s.firstName} {s.lastName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{s.externalId}</p>
                    </div>

                    <Badge>Active</Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => openViewProfile(s)}>
                    View
                  </Button>

                  <Button className="w-full bg-gradient-primary text-white" onClick={() => openEditStudent(s)}>
                    Edit
                  </Button>

                  <Button variant="secondary" className="w-full" onClick={() => openManageRoster(s)}>
                    Manage Classes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* PROFILE VIEW */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={selectedStudent.photoUrl || "/placeholder.svg"} />
              </Avatar>

              <p><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
              <p><strong>ID:</strong> {selectedStudent.externalId}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT STUDENT */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">

            <Label>First Name</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />

            <Label>Last Name</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />

            <Label>Student ID</Label>
            <Input value={formData.externalId} onChange={(e) => setFormData({ ...formData, externalId: e.target.value })} />

            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })} />

            <Label>Change Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />

            <Button type="submit" className="w-full bg-gradient-primary text-white" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ROSTER MANAGEMENT */}
      <Dialog open={isRosterDialogOpen} onOpenChange={setIsRosterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Manage Class Enrollment</DialogTitle></DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <p className="font-semibold text-lg text-center">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>

              <h3 className="font-medium mt-4">Current Classes</h3>

              {roster.length === 0 && (
                <p className="text-sm text-muted-foreground">Not enrolled in any classes</p>
              )}

              {roster.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-2 border rounded-md">
                  <span>{cls.name} ({cls.code})</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await classApi.removeFromRoster(cls.id, selectedStudent.id);
                      openManageRoster(selectedStudent);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <h3 className="font-medium mt-6">Add to Class</h3>

              <select
                className="w-full border p-2 rounded-md"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select class…</option>
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>

              <Button
                className="w-full bg-gradient-primary text-white mt-3"
                disabled={!selectedClassId}
                onClick={async () => {
                  await classApi.addToRoster(selectedClassId, selectedStudent.externalId);
                  openManageRoster(selectedStudent);
                }}
              >
                Add to Class
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
