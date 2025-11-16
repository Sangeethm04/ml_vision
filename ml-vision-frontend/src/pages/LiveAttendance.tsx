import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Square, PlayCircle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { classApi, attendanceApi, AttendanceRecord } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function LiveAttendance() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const sessionIdRef = useRef("");
  const sessionStartedAtRef = useRef("");
  const [savedAttendance, setSavedAttendance] = useState<AttendanceRecord[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureInterval = useRef<number>();
  const { toast } = useToast();

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classApi.getAll,
  });

  const handleStartCapture = async () => {
    if (!selectedClass) {
      toast({ title: "Please select a class", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      setIsCapturing(true);
      const newSessionId = crypto.randomUUID();
      const startAt = new Date().toISOString();
      setSessionId(newSessionId);
      setSessionStartedAt(startAt);
      sessionIdRef.current = newSessionId;
      sessionStartedAtRef.current = startAt;

      captureInterval.current = window.setInterval(() => {
        handleCaptureFrame();
      }, 1000);

      toast({ title: "Camera started" });
    } catch (error) {
      toast({ title: "Failed to access camera", variant: "destructive" });
    }
  };

  const handleStopCapture = async () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = undefined;
    }

    if (sessionId && sessionStartedAt) {
      try {
        await attendanceApi.markAbsences(selectedClass, sessionId, sessionStartedAt);
      } catch (err) {
        toast({ title: "Failed to mark absences", variant: "destructive" });
      }
    }

    setIsCapturing(false);
    setSessionId("");
    setSessionStartedAt("");
    sessionIdRef.current = "";
    sessionStartedAtRef.current = "";
    setSavedAttendance([]);
  };

  useEffect(() => {
    return () => {
      if (captureInterval.current) clearInterval(captureInterval.current);
    };
  }, []);

  const handleCaptureFrame = async () => {
    const activeSessionId = sessionIdRef.current;
    const activeSessionStartedAt = sessionStartedAtRef.current;
    if (!videoRef.current || !selectedClass || !activeSessionId || !activeSessionStartedAt)
      return;

    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg")
      );

      const file = new File([blob], "frame.jpg", { type: "image/jpeg" });

      const saved = await attendanceApi.submitFrame(
        file,
        selectedClass,
        activeSessionId,
        activeSessionStartedAt
      );

      setSavedAttendance((prev) => {
        const map = new Map(prev.map((r) => [r.id, r]));
        saved.forEach((r) => map.set(r.id, r));
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      // toast({
      //   title: `Recognized ${result.recognized.length} student(s)`,
      //   description: "Attendance marked successfully",
      // });
    } catch (error) {
      //toast({ title: "Failed to process frame", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Live Attendance
        </h1>
        <p className="text-muted-foreground mt-2">
          Capture attendance using face recognition
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Select Class</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardContent className="p-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover ${
                    !isCapturing ? "hidden" : ""
                  }`}
                />
                {!isCapturing && (
                  <Camera className="h-24 w-24 text-muted-foreground" />
                )}
                <div className="absolute top-4 right-4">
                  <Badge
                    variant={isCapturing ? "default" : "secondary"}
                    className="gap-2"
                  >
                    {isCapturing ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        Live
                      </>
                    ) : (
                      "Standby"
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {!isCapturing ? (
              <Button
                className="flex-1 bg-gradient-primary text-white"
                size="lg"
                onClick={handleStartCapture}
                disabled={!selectedClass}
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Capture
              </Button>
            ) : (
              <>
                <Button
                  className="flex-1 bg-gradient-primary text-white"
                  size="lg"
                  onClick={handleCaptureFrame}
                  disabled={isProcessing}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {isProcessing ? "Processing..." : "Capture Frame"}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleStopCapture}
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        <div>
          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recorded Attendance</h3>
                <Badge variant="secondary">
                  {savedAttendance.length} Saved
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {savedAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No attendance recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {savedAttendance.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {record.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.timestamp), "PPP p")}
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={record.confidence * 100}
                              className="w-20 h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {(record.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          {record.position && (
                            <span className="text-xs text-muted-foreground">
                              {record.position}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default">#{record.id.slice(0, 8)}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
