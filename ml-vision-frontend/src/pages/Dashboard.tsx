import { motion } from "framer-motion";
import { Users, BookOpen, UserCheck, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { studentApi, classApi } from "@/services/api";

export default function Dashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentApi.getAll,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const stats = [
    { icon: Users, label: "Total Students", value: students.length.toString(), change: "—", trend: "up" },
    { icon: BookOpen, label: "Active Classes", value: classes.length.toString(), change: "—", trend: "up" },
    { icon: UserCheck, label: "Today's Attendance", value: "—", change: "N/A", trend: "up" },
    { icon: TrendingUp, label: "Average Rate", value: "—", change: "N/A", trend: "up" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Welcome! Here's your ML Vision attendance overview.</p>
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
                <p className="text-xs text-muted-foreground mt-1">{stat.change} from last period</p>
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
              <div className="text-center py-8 text-muted-foreground">
                <p>Attendance history not yet available</p>
                <p className="text-sm mt-2">Start taking attendance to see activity here</p>
              </div>
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
                <Button className="w-full justify-start bg-gradient-primary text-white" size="lg">
                  <BookOpen className="h-5 w-5 mr-3" />
                  Start Live Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="h-5 w-5 mr-3" />
                  Manage Students
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
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
