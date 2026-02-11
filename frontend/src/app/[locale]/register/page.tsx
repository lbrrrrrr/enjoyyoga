import { getClasses, type YogaClass } from "@/lib/api";
import { RegistrationForm } from "@/components/forms/RegistrationForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let classes: YogaClass[] = [];
  try {
    classes = await getClasses();
  } catch {
    // API not available
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <RegistrationForm classes={classes} locale={locale} />
    </div>
  );
}
