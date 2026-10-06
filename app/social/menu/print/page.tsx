import { redirect } from "next/navigation";

// The Menu section moved to its own top-level area.
export default function Page() {
  redirect("/menu");
}
