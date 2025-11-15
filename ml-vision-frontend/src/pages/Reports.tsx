import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classApi } from "@/services/api";

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">View attendance reports and analytics</p>
        </div>
        <Button className="bg-gradient-primary text-white shadow-elegant hover:opacity-90">
          <Download className="h-4 w-4 mr-2" />
          Export Report
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
              <p className="text-3xl font-bold">—%</p>
              <p className="text-sm text-muted-foreground mt-1">Average Attendance</p>
              <p className="text-xs text-muted-foreground mt-2">Data not yet available</p>
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
            <div className="text-center py-12 text-muted-foreground">
              <p>No attendance records available yet</p>
              <p className="text-sm mt-2">Attendance history will appear here once you start taking attendance</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
