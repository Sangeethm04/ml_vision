import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Square, PlayCircle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { classApi, attendanceApi, RecognizedStudent } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function LiveAttendance() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [recognized, setRecognized] = useState<RecognizedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureInterval = useRef<number>();
  const { toast } = useToast();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classApi.getAll,
  });

  const handleStartCapture = async () => {
    if (!selectedClass) {
      toast({ title: "Please select a class", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
      captureInterval.current = window.setInterval(() => {
        handleCaptureFrame();
      }, 1000); // every 1s
      toast({ title: "Camera started" });
    } catch (error) {
      toast({ title: "Failed to access camera", variant: "destructive" });
    }
  };

  const handleStopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = undefined;
    }
    setIsCapturing(false);
    setRecognized([]);
  };

  useEffect(() => {
    return () => {
      if (captureInterval.current) clearInterval(captureInterval.current);
    };
  }, []);

  const handleCaptureFrame = async () => {
  if (!videoRef.current || !selectedClass) return;

  setIsProcessing(true);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg')
    );

    const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });

    const result = await attendanceApi.submitFrame(file, selectedClass);

    setRecognized(result.recognized);
    toast({
      title: `Recognized ${result.recognized.length} student(s)`,
      description: "Attendance marked successfully"
    });
  } catch (error) {
    toast({ title: "Failed to process frame", variant: "destructive" });
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
        <p className="text-muted-foreground mt-2">Capture attendance using face recognition</p>
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
                  className={`absolute inset-0 w-full h-full object-cover ${!isCapturing ? 'hidden' : ''}`}
                />
                {!isCapturing && (
                  <Camera className="h-24 w-24 text-muted-foreground" />
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant={isCapturing ? "default" : "secondary"} className="gap-2">
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
                <h3 className="text-lg font-semibold">Recognized Students</h3>
                <Badge variant="secondary">{recognized.length} Detected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recognized.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No students detected yet</p>
              ) : (
                <div className="space-y-3">
                  {recognized.map((student, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Student {student.student_id}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={student.confidence * 100} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {(student.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          {student.position && (
                            <span className="text-xs text-muted-foreground">{student.position}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default">Detected</Badge>
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
