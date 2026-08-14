import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "@/app/login/login-form";
import { LanguageSwitcher } from "@/app/language-switcher";

export default async function LoginPage() {
  const { locale, t } = await getDictionary();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
      </div>
      <LoginForm t={t} />
    </main>
  );
}
