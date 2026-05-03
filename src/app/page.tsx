import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Client without tenant → onboarding
  if (user.role === "client" && !user.tenant_id) {
    redirect("/onboarding");
  }

  if (user.role === "client") {
    redirect("/client");
  }

  redirect("/admin");
}
