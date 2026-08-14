import { spawn } from "node:child_process";
import { promises as fs, createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_INPUT_BYTES = 500 * 1024 * 1024;

const VIDEO_EXT = new Set([
  "mp4", "m4v", "mov", "webm", "mkv", "avi", "mpg", "mpeg", "wmv", "flv", "3gp", "ts", "mts", "m2ts",
]);

export const AUDIO_EXT = new Set([
  "mp3", "wav", "flac", "m4a", "aac", "ogg", "oga", "opus", "webm",
  "aiff", "aif", "alac", "amr", "wma", "ac3", "mka", "caf", "au",
]);

export interface ConversionResult {
  outputPath: string;
  size: number;
  filename: string;
}

export function isSupported(filename: string, mimeType: string): boolean {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (VIDEO_EXT.has(ext) || AUDIO_EXT.has(ext)) return true;
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return true;
  return false;
}

export async function convertToMp3(
  input: Buffer,
  originalFilename: string,
  mimeType: string,
): Promise<ConversionResult> {
  const ext = originalFilename.toLowerCase().split(".").pop() || "bin";
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resonate-"));
  const inputPath = path.join(tmpDir, `input.${ext}`);
  const outputPath = path.join(tmpDir, "output.mp3");

  try {
    await fs.writeFile(inputPath, input);

    const isAlreadyMp3 = ext === "mp3" && (mimeType === "audio/mpeg" || mimeType === "audio/mp3");
    const args = isAlreadyMp3
      ? ["-y", "-i", inputPath, "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
      : [
          "-y",
          "-i", inputPath,
          "-vn",
          "-c:a", "libmp3lame",
          "-b:a", "192k",
          "-ar", "44100",
          "-ac", "2",
          outputPath,
        ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}`));
      });
    });

    const stat = await fs.stat(outputPath);
    const baseName = originalFilename.replace(/\.[^.]+$/, "");
    return {
      outputPath,
      size: stat.size,
      filename: `${baseName}.mp3`,
    };
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

export async function cleanupConversion(result: ConversionResult): Promise<void> {
  const tmpDir = path.dirname(result.outputPath);
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}

export function checkInputSize(sizeBytes: number) {
  if (sizeBytes > MAX_INPUT_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_INPUT_BYTES / 1024 / 1024)} MB)`);
  }
}
