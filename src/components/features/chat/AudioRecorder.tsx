'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AudioRecorderProps {
  onTranscription: (transcribedText: string) => void
}

export default function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }, [])

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false); // Stop recording mode
    setIsProcessing(true); // Show processing state
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // Starting audio transcription

    setIsProcessing(true); // Show processing state

    try {
      const formData = new FormData();
      formData.append("audioFile", audioBlob, "recording.wav"); // Match DTO field name

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audio/transcribe`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Ensure authentication if required
        },
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      // Transcription completed successfully

      if (data) {
        onTranscription(data);
      } else {
        console.warn("⚠️ No transcription returned from API.");
      }
    } catch (error) {
      console.error("❌ Audio transcription failed:", error);
      toast.error(error instanceof Error ? `Error: ${error.message}` : "An unknown error occurred.");
    } finally {
      setIsProcessing(false); // Reset microphone button state
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("❌ Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Audio data available
          audioChunks.current.push(event.data);
        } else {
          console.warn("⚠️ No audio data captured.");
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        // Recording completed, preparing transcription
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      // Recording started

      // ✅ Automatically stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          // Auto-stopping recording after timeout
          stopRecording();
        }
      }, 30000); // Auto-stop after 30s
    } catch (error) {
      console.error("❌ Microphone access error:", error);
      toast.error("Could not access microphone. Check browser permissions.");
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant="ghost"
        size="icon"
        className={(() => {
          if (isProcessing) return 'h-10 w-10 rounded-full transition-colors duration-200 text-gray-400 cursor-not-allowed';
          if (isRecording) return 'h-10 w-10 rounded-full transition-colors duration-200 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30';
          return 'h-10 w-10 rounded-full transition-colors duration-200 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
        })()}
        disabled={isProcessing} // ✅ Prevent clicking while processing
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {(() => {
          if (isProcessing) return <Loader2 className="w-5 h-5 animate-spin" />;
          if (isRecording) return <MicOff className="w-5 h-5" />;
          return <Mic className="w-5 h-5" />;
        })()}
      </Button>


    </div>
  )
}
