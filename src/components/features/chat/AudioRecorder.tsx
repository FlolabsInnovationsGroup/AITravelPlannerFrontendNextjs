// src/components/features/chat/AudioRecorder.tsx
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
      toast.error("Audio recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        audioChunks.current = [] // Clear the buffer
        await transcribeAudio(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast.error("Could not access microphone.")
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    setIsProcessing(true)
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const response = await sendMessagesEntity("", sessionId, audioBlob);
    
      if (response.message) {
        onTranscription(response.message)
      } 

      if (response.suggestions) {
        console.log("Suggestions:", response.suggestions);
      }
    } catch (error) {
      console.error("Error during audio transcription:", error);
      toast.error("Error during audio transcription.");
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="relative inline-flex items-center">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-full ${
          isRecording ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
          : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        } transition-colors duration-200`}
        disabled={isProcessing}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
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