import { requireAdmin } from "@/lib/auth";
import { CalendarioClient } from "./calendario-client";

export default async function CalendarioPage() {
  await requireAdmin();
  return <CalendarioClient />;
}
