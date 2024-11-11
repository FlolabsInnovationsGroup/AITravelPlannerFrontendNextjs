import React, { useState, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

interface AudioRecorderProps {
  onTranscription: (transcribedText: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks: Blob[] = [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('audioFile', audioFile);

        const response = await fetch('http://localhost:8081/api/audio/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.text();
          onTranscription(data);
        } else {
          console.error('Error transcribing audio:', response.statusText);
        }
      };
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="text-center">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`p-3 rounded-full transition ${
          recording ? 'bg-red-500' : 'bg-primary'
        } hover:bg-opacity-80`}
      >
        {recording ? (
          <StopIcon className="h-8 w-8 text-white" />
        ) : (
          <MicrophoneIcon className="h-8 w-8 text-white" />
        )}
      </button>
    </div>
  );
};

export default AudioRecorder;

