import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Download, File as FileIcon } from "lucide-react";
import { getFile, getEmbedSettings } from "@/lib/db";
import { formatBytes, formatDate, renderEmbedTemplate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { AudioPlayer } from "@/app/audio-player";
import { VideoPlayer } from "@/app/video-player";
import { ReportButton } from "@/app/report-button";
import { QrCodeButton } from "@/app/qr-code-button";
import { LanguageSwitcher } from "@/app/language-switcher";

const siteName = process.env.SITE_NAME || "jinxmrcl";

function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

async function loadRecord(id: string) {
  return getFile(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const record = await loadRecord(id);
  if (!record) return {};

  const rawUrl = `${siteUrl()}/raw/${record.stored_name}`;
  const isImage = record.mime.startsWith("image/");
  const isVideo = record.mime.startsWith("video/");

  const settings = await getEmbedSettings(record.uploader);
  const vars = {
    filename: record.original_name,
    size: formatBytes(record.size),
    uploader: record.uploader,
    site: settings.siteName,
  };
  const title = renderEmbedTemplate(settings.titleTemplate, vars) || record.original_name;
  const description = renderEmbedTemplate(settings.descriptionTemplate, vars);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: settings.siteName,
      images: isImage ? [rawUrl] : [],
      videos: isVideo ? [rawUrl] : [],
    },
    twitter: {
      card: isImage ? "summary_large_image" : "summary",
      title,
      description,
      images: isImage ? [rawUrl] : [],
    },
    other: {
      "theme-color": settings.color,
    },
  };
}

export default async function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await loadRecord(id);
  if (!record) notFound();
  const { locale, t } = await getDictionary();

  const rawUrl = `/raw/${record.stored_name}`;
  const downloadUrl = `/raw/${record.stored_name}?download`;
  const isImage = record.mime.startsWith("image/");
  const isVideo = record.mime.startsWith("video/");
  const isAudio = record.mime.startsWith("audio/");

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-base font-bold uppercase tracking-tight text-white">
          {siteName}
        </Link>
        <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16 pt-4 sm:px-6">
        <div className="group relative flex max-h-[75vh] max-w-full items-center justify-center overflow-hidden rounded-2xl">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t.viewer.openOriginal}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            >
              <ArrowUpRight size={18} />
            </a>
            <a
              href={downloadUrl}
              title={t.viewer.download}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            >
              <Download size={18} />
            </a>
            <QrCodeButton
              url={`${siteUrl()}/${record.id}`}
              fileName={record.original_name}
              t={t}
              variant="ghost"
              iconSize={18}
              className="h-9 w-9 bg-black/60 text-white backdrop-blur hover:bg-black/80"
            />
            <ReportButton fileId={record.id} t={t} />
          </div>

          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rawUrl}
              alt={record.original_name}
              className="h-auto max-h-[75vh] w-auto max-w-full rounded-2xl object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            />
          )}
          {isVideo && <VideoPlayer src={rawUrl} />}
          {isAudio && <AudioPlayer src={rawUrl} />}
          {!isImage && !isVideo && !isAudio && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-14 text-white/50">
              <FileIcon size={48} />
              <span>{t.viewer.noPreview}</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-[15px] font-semibold text-white">
            {record.original_name}{" "}
            <span className="font-normal text-white/40">({formatBytes(record.size)})</span>
          </p>
          <p className="mt-1 text-sm text-white/40">
            {t.viewer.uploadedBy} {formatDate(record.created_at)} {t.viewer.by}{" "}
            <span className="font-semibold text-white/70">{record.uploader}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
