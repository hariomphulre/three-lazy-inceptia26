let globalStream: MediaStream | null = null;

export async function getCameraStream() {
  if (!globalStream) {
    globalStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
  return globalStream;
}

export function stopCameraStream() {
  if (globalStream) {
    globalStream.getTracks().forEach(track => track.stop());
    globalStream = null;
    console.log("🛑 GLOBAL CAMERA STOPPED");
  }
}
