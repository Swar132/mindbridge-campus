import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';

export default function VoiceNoteRecorder({ onAudioReady, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to turn off mic indicator
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= 60) {
            // Cap recording at 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setPermissionError('Microphone access was denied or is unavailable. Please grant permission in your browser.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (!audioBlob) return;
    // Convert blob to Base64 data URL for persistence
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64Audio = reader.result;
      onAudioReady({
        blob: audioBlob,
        url: audioUrl,
        base64: base64Audio,
        durationSeconds: elapsed,
      });
    };
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="liquid-glass rounded-2xl p-3.5 border border-teal-200/90 shadow-wellness-sm animate-fade-in space-y-3">
      {permissionError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold text-charcoal-800">Recording Voice Reflection...</span>
            <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
              {formatTime(elapsed)} / 1:00
            </span>
          </div>

          {/* Animated Waveform Visualizer */}
          <div className="flex items-center gap-1">
            {[40, 70, 100, 60, 90, 50, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-teal-500 rounded-full wave-bar"
                style={{ animationDelay: `${i * 0.15}s`, height: `${h * 0.2}px` }}
              ></span>
            ))}
          </div>

          <button
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Not recording and no audio yet */}
      {!isRecording && !audioUrl && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-charcoal-600 flex items-center gap-2">
            <Mic className="w-4 h-4 text-teal-600" />
            <span>Record an audio voice note (up to 1 minute)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startRecording}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Recording</span>
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-charcoal-400 hover:text-charcoal-700 px-2 py-1"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recording Finished - Audio Preview & Controls */}
      {!isRecording && audioUrl && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={togglePlayback}
              className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition shrink-0 shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="text-xs">
              <span className="font-bold text-charcoal-800">Voice Note Preview</span>
              <span className="text-charcoal-500 ml-2">({formatTime(elapsed)})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setAudioUrl(null);
                setAudioBlob(null);
                if (onCancel) onCancel();
              }}
              className="p-2 rounded-xl text-charcoal-500 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Discard"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleSend}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-wellness-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Use Voice Note</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
