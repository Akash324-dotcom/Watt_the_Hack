import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Plus, Zap, Video, Square, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActionLoggerProps {
  session: Session | null;
  onActionVerified?: () => void;
}

const ACTION_TYPES = [
  { value: 'recycle', label: 'Recycle' },
  { value: 'plant', label: 'Plant Trees' },
  { value: 'bike', label: 'Bike Transport' },
  { value: 'public_transport', label: 'Public Transport' },
  { value: 'reduce_waste', label: 'Reduce Waste' },
  { value: 'save_energy', label: 'Save Energy' },
  { value: 'volunteer', label: 'Volunteer' },
];

export default function ActionLogger({ session, onActionVerified }: ActionLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    if (!actionType) {
      toast.error('Please select an action type first');
      return;
    }

    try {
      // Request camera access (rear camera preferred for better action capture)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      streamRef.current = stream;
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processRecording();
      };

      // Handle when camera access is revoked
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('🎥 Recording started', {
        description: 'Show us what you\'re doing!',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start camera', {
        description: 'Please allow camera permission',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const extractFrames = async (videoBlob: Blob): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];

      video.src = URL.createObjectURL(videoBlob);
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        const frameCount = Math.min(5, Math.ceil(duration)); // Extract up to 5 frames
        const interval = duration / frameCount;

        let currentFrame = 0;
        
        const captureFrame = () => {
          if (currentFrame >= frameCount) {
            URL.revokeObjectURL(video.src);
            resolve(frames);
            return;
          }

          video.currentTime = currentFrame * interval;
        };

        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          currentFrame++;
          captureFrame();
        };

        captureFrame();
      };

      video.load();
    });
  };

  const processRecording = async () => {
    setIsProcessing(true);
    setVerificationResult(null);

    try {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      
      toast.info('🔍 Extracting frames from video...', {
        description: 'This may take a moment',
      });

      // Extract frames from video
      const frames = await extractFrames(videoBlob);

      if (frames.length === 0) {
        throw new Error('Failed to extract frames from video');
      }

      toast.info('🤖 Analyzing with AI...', {
        description: 'Verifying your action',
      });

      // Upload video to storage (optional, for audit trail)
      const videoFileName = `${session?.user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('action-recordings')
        .upload(videoFileName, videoBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      // Send frames to verification endpoint
      const { data, error } = await supabase.functions.invoke('verify-video-action', {
        body: {
          actionType,
          frames: frames.slice(0, 3), // Send first 3 frames
          videoPath: uploadError ? null : videoFileName,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationResult(data.verification);

      if (data.verification.verified) {
        toast.success('✅ Action Verified!', {
          description: `You earned ${data.verification.pointsAwarded} points!`,
        });
        // Notify parent component to refresh points
        onActionVerified?.();
      } else {
        toast.error('❌ Action Not Verified', {
          description: data.verification.feedback,
        });
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsProcessing(false);
      recordedChunksRef.current = [];
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsOpen(false);
    setActionType('');
    setVerificationResult(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="bg-gradient-nature hover:shadow-elevated animate-electric-pulse"
        >
          <Plus size={20} className="mr-2" />
          Log Action
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="glass-card border-electric/30 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Zap className="text-electric" />
              Video Action Verification
            </DialogTitle>
            <DialogDescription>
              Select your action, record yourself doing it, and let AI verify it for points
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Action Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Action Type
              </label>
              <Select 
                value={actionType} 
                onValueChange={setActionType}
                disabled={isRecording || isProcessing}
              >
                <SelectTrigger className="glass-card border-electric/30">
                  <SelectValue placeholder="Select an action type" />
                </SelectTrigger>
                <SelectContent className="glass-card border-electric/30">
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recording Status */}
            <AnimatePresence mode="wait">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </div>
                      <div>
                        <p className="font-semibold text-red-700 dark:text-red-300">
                          Recording in Progress
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Time: {formatTime(recordingTime)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">LIVE</Badge>
                  </div>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">
                        Processing Video...
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Analyzing with AI to verify your action
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {verificationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border-2 ${
                    verificationResult.verified
                      ? 'bg-green-50 border-green-500 dark:bg-green-950/20'
                      : 'bg-red-50 border-red-500 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {verificationResult.verified ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className={`font-semibold text-lg ${
                          verificationResult.verified 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {verificationResult.verified ? 'Verified!' : 'Not Verified'}
                        </p>
                        <p className={`text-sm opacity-90 ${
                          verificationResult.verified 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Confidence: {verificationResult.confidence}%
                        </p>
                      </div>
                      
                      <p className={`text-sm ${
                        verificationResult.verified 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
                      }`}>{verificationResult.feedback}</p>
                      
                      {verificationResult.verified && (
                        <div className="pt-2 border-t border-current/20">
                          <p className="text-lg font-bold">
                            🎉 +{verificationResult.pointsAwarded} points earned!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isRecording && !isProcessing && !verificationResult && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-electric/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={startRecording}
                    disabled={!actionType}
                    className="bg-gradient-nature"
                  >
                    <Video size={16} className="mr-2" />
                    Start Recording
                  </Button>
                </>
              )}

              {isRecording && (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="col-span-2"
                  size="lg"
                >
                  <Square size={16} className="mr-2" />
                  Stop Recording
                </Button>
              )}

              {(isProcessing || verificationResult) && (
                <Button
                  onClick={handleClose}
                  className="col-span-2 bg-gradient-nature"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Close'}
                </Button>
              )}
            </div>

            {/* Instructions */}
            {!isRecording && !isProcessing && !verificationResult && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-semibold mb-1">📹 How it works:</p>
                <ol className="space-y-1 ml-4 list-decimal">
                  <li>Select the action you're about to perform</li>
                  <li>Click "Start Recording" and allow camera access</li>
                  <li>Record yourself performing the action</li>
                  <li>Click "Stop Recording" when done</li>
                  <li>AI will analyze the video and verify your action</li>
                  <li>Earn points if verified!</li>
                </ol>
                <p className="mt-2 text-xs italic">
                  💡 Tip: Use the rear camera on mobile for better capture of your actions
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}