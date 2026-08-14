import { getDictionary } from "@/lib/i18n";
import { UploadClient } from "@/app/dashboard/upload/upload-client";

export default async function UploadPage() {
  const { t } = await getDictionary();
  return <UploadClient t={t} />;
}
