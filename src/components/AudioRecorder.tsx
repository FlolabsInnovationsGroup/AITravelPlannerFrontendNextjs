'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sendMessagesEntity } from '@/lib/api'

interface AudioRecorderProps {
  sessionId: string
  onTranscription: (transcribedText: string) => void
}

export default function AudioRecorder({ sessionId, onTranscription }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

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







  return (
    <div className="relative inline-flex items-center">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-full transition-colors duration-200 ${isProcessing
            ? 'text-gray-400 cursor-not-allowed' // ✅ Disable button when processing
            : isRecording
              ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
              : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        disabled={isProcessing} // ✅ Prevent clicking while processing
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" /> // ✅ Show spinner during processing
        ) : isRecording ? (
          <MicOff className="w-5 h-5" /> // ✅ Show "mic off" while recording
        ) : (
          <Mic className="w-5 h-5" /> // ✅ Show default mic icon when ready
        )}
      </Button>

      {isRecording && (
        <div className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            {Math.floor(recordingDuration)}s
          </div>
        </div>
      )}
    </div>
  )
}