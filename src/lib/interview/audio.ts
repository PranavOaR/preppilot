export function createRecorder(): Promise<{
  start: () => void;
  stop: () => Promise<Blob>;
  stream: MediaStream;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      resolve({
        start: () => {
          chunks.length = 0;
          mediaRecorder.start(250); // collect in 250ms chunks
        },
        stop: () =>
          new Promise<Blob>((res) => {
            mediaRecorder.onstop = () => {
              res(new Blob(chunks, { type: mediaRecorder.mimeType }));
            };
            mediaRecorder.stop();
          }),
        stream,
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function playAudio(audioData: ArrayBuffer): Promise<void> {
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(audioData.slice(0));
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  return new Promise((resolve) => {
    source.onended = () => {
      audioCtx.close();
      resolve();
    };
    source.start();
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data URL prefix
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}
