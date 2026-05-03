import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // If user already has a tenant, skip onboarding
  if (user.tenant_id) {
    redirect(user.role === "admin" ? "/admin" : "/client");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[#080a10]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,120,50,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,50,255,0.05),transparent_50%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
          <Zap className="size-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Agencia</span>
        <span className="text-xs text-neutral-500 ml-auto">
          {user.email}
        </span>
      </div>

      {/* Wizard */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <OnboardingWizard userId={user.id} />
      </div>
    </div>
  );
}
