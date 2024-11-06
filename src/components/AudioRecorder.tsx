import React, { useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

interface AudioRecorderProps {
  onAudioUpload: (audioFile: File) => Promise<void>;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioUpload }) => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
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
        setAudioURL(URL.createObjectURL(audioBlob));

        await onAudioUpload(audioFile);
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
      {audioURL && (
        <audio
          src={audioURL}
          controls
          style={{ width: '100%', marginTop: '1rem', borderRadius: '5px' }}
        />
      )}
    </div>
  );
};

export default AudioRecorder;
