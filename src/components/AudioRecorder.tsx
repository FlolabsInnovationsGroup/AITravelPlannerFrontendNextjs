import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button"; // Update path based on your setup
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AudioRecorderProps {
  sessionId: string;
  onTranscription: (transcribedText: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ sessionId, onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        audioChunks.current = []; // Clear the buffer
        await transcribeAudio(audioBlob); // Transcribe the recorded audio
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audioFile", audioBlob);
    formData.append("sessionId", sessionId);

    // Retrieve token (adjust this according to your token storage logic)
    const token = localStorage.getItem('token'); // or from context

    try {
        const response = await fetch("http://localhost:8081/api/audio/transcribe", {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                onTranscription(data.transcription);
            } else {
                // Handle plain text response
                const textData = await response.text();
                console.warn("Received non-JSON response:", textData);
                onTranscription(textData); // Directly use the plain text response as transcription
            }
        } else {
            const errorText = await response.text();
            console.error("Transcription failed:", errorText);
            toast.error("Failed to transcribe audio.");
        }
    } catch (error) {
        console.error("Error during audio transcription:", error);
        toast.error("Error during audio transcription.");
    }
};





      

  return (
    <div>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        className={`rounded-full ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>
    </div>
  );
};

export default AudioRecorder;
