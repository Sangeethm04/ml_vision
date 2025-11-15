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
  const [formData, setFormData] = useState({ firstName: "", lastName: "", externalId: "", email: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: studentApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddDialogOpen(false);
      setFormData({ firstName: "", lastName: "", externalId: "", email: "" });
      toast({ title: "Student created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create student", variant: "destructive" });
    },
  });

  const filteredStudents = students.filter((student: Student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.externalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-muted-foreground mt-2">Manage student profiles and face recognition data</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white shadow-elegant hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input 
                  id="studentId" 
                  placeholder="S2024001"
                  value={formData.externalId}
                  onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="student@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">Note: Photo upload will be available after creating the student</p>
              <Button type="submit" className="w-full bg-gradient-primary text-white" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Add Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name or ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No students found</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student: Student, index: number) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader className="bg-gradient-card">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={student.photoUrl || "/placeholder.svg"} />
                      <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{student.firstName} {student.lastName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{student.externalId}</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Email:</span>
                    <span>{student.email}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1">
                      View Profile
                    </Button>
                    <Button className="flex-1 bg-gradient-primary text-white">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
