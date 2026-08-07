// Utilities for face detection monitoring and logging

export interface FaceDetectionLog {
  timestamp: number;
  alertType: string | null;
  faceCount: number;
  message: string;
}

class FaceDetectionLogger {
  private logs: FaceDetectionLog[] = [];
  private maxLogs: number = 1000;

  logAlert(
    alertType: string | null,
    faceCount: number,
    message: string
  ): void {
    const log: FaceDetectionLog = {
      timestamp: Date.now(),
      alertType,
      faceCount,
      message,
    };

    this.logs.push(log);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[FaceDetection] ${alertType || "OK"} - Faces: ${faceCount} - ${message}`
      );
    }
  }

  getLogs(): FaceDetectionLog[] {
    return [...this.logs];
  }

  getSummary(): {
    totalAlerts: number;
    alertsByType: Record<string, number>;
    averageFaceCount: number;
  } {
    const alertsByType: Record<string, number> = {};
    let totalAlerts = 0;
    let totalFaces = 0;

    this.logs.forEach((log) => {
      if (log.alertType) {
        totalAlerts++;
        alertsByType[log.alertType] =
          (alertsByType[log.alertType] || 0) + 1;
      }
      totalFaces += log.faceCount;
    });

    return {
      totalAlerts,
      alertsByType,
      averageFaceCount:
        this.logs.length > 0 ? totalFaces / this.logs.length : 0,
    };
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const faceDetectionLogger = new FaceDetectionLogger();

// Utility function to calculate distance between two points
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Utility function to check if face is centered in frame
export function isFaceCentered(
  faceStart: [number, number],
  frameDimensions: { width: number; height: number }
): boolean {
  const centerX = frameDimensions.width / 2;
  const centerY = frameDimensions.height / 2;

  // Calculate distance from center
  const distance = calculateDistance(faceStart, [centerX, centerY]);

  // If distance is more than 25% of frame width, consider it off-center
  return distance < frameDimensions.width * 0.25;
}

// Utility function to check brightness (for bad lighting detection)
export function getImageBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let brightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate luminance
    brightness += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return brightness / (data.length / 4);
}

// Utility function to send monitoring data to backend for analytics
export async function sendMonitoringData(
  sessionId: number,
  data: {
    alerts: FaceDetectionLog[];
    duration: number;
    summary: ReturnType<FaceDetectionLogger["getSummary"]>;
  }
): Promise<void> {
  try {
    const response = await fetch("/api/session/monitoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId.toString(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.warn("Failed to send monitoring data:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending monitoring data:", error);
  }
}
