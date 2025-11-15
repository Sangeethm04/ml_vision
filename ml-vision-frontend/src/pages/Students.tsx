import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { studentApi, Student } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // NEW: File upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    externalId: "",
    email: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentApi.getAll,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // CREATE
  const createMutation = useMutation({
    mutationFn: studentApi.createWithPhoto, // NEW
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsAddDialogOpen(false);
      setFormData({ firstName: "", lastName: "", externalId: "", email: "" });
      setPhotoFile(null);
      toast({ title: "Student created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create student", variant: "destructive" });
    },
  });

  // EDIT
  const editMutation = useMutation({
    mutationFn: (data: any) =>
      studentApi.updateWithPhoto(selectedStudent!.id, data), // NEW
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsEditDialogOpen(false);
      toast({ title: "Student updated" });
    },
    onError: () => {
      toast({ title: "Failed to update student", variant: "destructive" });
    },
  });

  const filteredStudents = students.filter((student: Student) =>
    `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    student.externalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ADD
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    Object.entries(formData).forEach(([key, val]) =>
      fd.append(key, val as string)
    );

    if (photoFile) fd.append("photo", photoFile); // NEW

    createMutation.mutate(fd);
  };

  // EDIT
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    Object.entries(formData).forEach(([key, val]) =>
      fd.append(key, val as string)
    );

    if (photoFile) fd.append("photo", photoFile); // NEW

    editMutation.mutate(fd);
  };

  const openViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileDialogOpen(true);
  };

  const openEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      externalId: student.externalId,
      email: student.email,
    });
    setPhotoFile(null); // reset
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage student profiles and face recognition data
          </p>
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
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />

              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />

              <Label>Student ID</Label>
              <Input
                value={formData.externalId}
                onChange={(e) =>
                  setFormData({ ...formData, externalId: e.target.value })
                }
                required
              />

              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />

              {/* NEW PHOTO UPLOAD */}
              <Label>Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />

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
              placeholder="Search students by name or ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* GRID OF STUDENTS */}
      {!isLoading && filteredStudents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-elegant">
                <CardHeader className="bg-gradient-card">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-primary">
                      <AvatarImage src={`${API_BASE}${student.photoUrl}`} />
                      <AvatarFallback>
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle>
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {student.externalId}
                      </p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openViewProfile(student)}
                    >
                      View
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-primary text-white"
                      onClick={() => openEditStudent(student)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* PROFILE DIALOG */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage
                  src={selectedStudent.photoUrl || "/placeholder.svg"}
                />
              </Avatar>

              <p>
                <strong>Name:</strong> {selectedStudent.firstName}{" "}
                {selectedStudent.lastName}
              </p>
              <p>
                <strong>Student ID:</strong> {selectedStudent.externalId}
              </p>
              <p>
                <strong>Email:</strong> {selectedStudent.email}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Label>First Name</Label>
            <Input
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />

            <Label>Last Name</Label>
            <Input
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />

            <Label>Student ID</Label>
            <Input
              value={formData.externalId}
              onChange={(e) =>
                setFormData({ ...formData, externalId: e.target.value })
              }
            />

            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            {/* NEW: PHOTO UPLOAD */}
            <Label>Change Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-primary text-white"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
