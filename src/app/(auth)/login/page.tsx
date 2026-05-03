import { Zap } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080a10]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,120,50,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,50,255,0.05),transparent_50%)]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm space-y-8 px-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/25">
              <Zap className="size-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Agencia
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Automacao de Conteudo com IA
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="text-center text-[11px] text-neutral-600">
          Powered by Claude + Gemini
        </p>
      </div>
    </div>
  );
}
