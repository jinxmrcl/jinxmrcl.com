import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function transcodeProfileVideo(inputPath: string, outputPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-an",
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "27",
    "-movflags", "+faststart",
    outputPath,
  ]);
}

export async function transcodeProfileAudio(inputPath: string, outputPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-vn",
    "-map", "0:a:0",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    outputPath,
  ]);
}
