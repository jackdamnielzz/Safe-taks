import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ApprovalInbox from "@/components/approvals/ApprovalInbox";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("approvals.page.title", { default: "Goedkeuringen" }),
    description: t("approvals.page.description", { default: "Beheer TRA goedkeuringsverzoeken" }),
  };
}

export default async function ApprovalsPage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("approvals.page.title", { default: "Goedkeuringen" })}
        </h1>
        <p className="mt-2 text-gray-600">
          {t("approvals.page.subtitle", {
            default: "Bekijk en beheer TRA goedkeuringsverzoeken die uw aandacht vereisen",
          })}
        </p>
      </div>

      <ApprovalInbox />
    </div>
  );
}
