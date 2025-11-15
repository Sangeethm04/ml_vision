import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { classApi, Class } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Classes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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
                      Roster count not yet available
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1">
                      Manage Roster
                    </Button>
                    <Button className="flex-1 bg-gradient-primary text-white">
                      Start Attendance
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
