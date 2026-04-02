"use client";

interface AudioRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function AudioRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  disabled,
}: AudioRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30"
            : disabled
            ? "bg-surface-container-high text-outline opacity-50 cursor-not-allowed"
            : "bg-primary-brand hover:bg-primary-brand/90 shadow-lg shadow-primary-brand/30 cursor-pointer"
        }`}
      >
        <span className="material-symbols-outlined text-[32px] text-white">
          {isRecording ? "stop" : "mic"}
        </span>
      </button>
      <p className="text-xs text-on-surface-variant">
        {isRecording
          ? "Recording... Click to stop"
          : disabled
          ? "Waiting..."
          : "Click to start answering"}
      </p>
    </div>
  );
}
