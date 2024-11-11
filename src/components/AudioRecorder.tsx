import React, { useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

interface AudioRecorderProps {
  onTranscription: (transcribedText: string) => void; // Prop to send transcribed text back
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
        formData.append('audioFile', audioFile); // Ensure the key matches the DTO on the backend

        // Send the audio file to the backend for transcription
        const response = await fetch('http://localhost:8081/api/audio/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.text(); // Expecting plain text response from the backend
          onTranscription(data); // Call the prop function with the transcribed text
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
    <div style={{ textAlign: 'center' }}>
      <IconButton onClick={recording ? stopRecording : startRecording} color="primary">
        {recording ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
      </IconButton>
    </div>
  );
};

export default AudioRecorder;
