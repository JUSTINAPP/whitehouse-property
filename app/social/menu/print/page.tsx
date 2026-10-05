"use client";

import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { PrintMenuStudio } from "@/components/menu/print-menu-studio";

export default function PrintMenusPage() {
  const { venue } = useVenue();

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
      <PageHeader
        title="Print menus"
        subtitle={`Edit ${venue.name}'s printed menus and download print-ready PDFs. The preview on the right is the real PDF, rebuilt as you type.`}
      />
      <PrintMenuStudio />
    </div>
  );
}
