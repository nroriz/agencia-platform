"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { StepEmpresa } from "./step-empresa";
import { StepVisual } from "./step-visual";
import { StepVoz } from "./step-voz";
import { StepConteudo } from "./step-conteudo";
import { StepFotos } from "./step-fotos";
import { StepInstagram } from "./step-instagram";
import { StepConfirmacao } from "./step-confirmacao";

const STEPS = [
  { title: "Sua Empresa", description: "Informacoes basicas" },
  { title: "Marca Visual", description: "Cores, fontes e logo" },
  { title: "Sua Voz", description: "Tom e linguagem" },
  { title: "Conteudo", description: "Territorios e horarios" },
  { title: "Fotos", description: "Imagens do negocio" },
  { title: "Instagram", description: "Conectar conta" },
  { title: "Confirmar", description: "Revisar e ativar" },
];

export interface OnboardingData {
  // Step 1
  nome: string;
  nicho: string;
  handle: string;
  cidade: string;
  sobre: string;
  // Step 2
  cor_fundo: string;
  cor_acento: string;
  cor_texto: string;
  fonte_headline: string;
  fonte_corpo: string;
  logo_url: string;
  // Step 3
  tom: string;
  palavras_proibidas: string[];
  expressoes_tipicas: string[];
  // Step 4
  territorios: Array<{ codigo: string; nome: string; peso: number }>;
  frequencia_semanal: number;
  horarios: Array<{ dia: string; hora: string }>;
  // Step 5
  fotos: Array<{ path: string; url: string; name: string }>;
  // Step 6
  instagram_connected: boolean;
  // Tenant ID (created on step 1 save)
  tenant_id: string;
}

const INITIAL_DATA: OnboardingData = {
  nome: "",
  nicho: "",
  handle: "",
  cidade: "",
  sobre: "",
  cor_fundo: "#0a0a0a",
  cor_acento: "#FF4103",
  cor_texto: "#ffffff",
  fonte_headline: "Inter",
  fonte_corpo: "Inter",
  logo_url: "",
  tom: "",
  palavras_proibidas: [],
  expressoes_tipicas: [],
  territorios: [],
  frequencia_semanal: 3,
  horarios: [],
  fotos: [],
  instagram_connected: false,
  tenant_id: "",
};

interface OnboardingWizardProps {
  userId: string;
}

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [completing, setCompleting] = useState(false);

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function complete() {
    setCompleting(true);
    const supabase = createClient();

    // Activate tenant
    await supabase
      .from("tenants")
      .update({ ativo: true })
      .eq("id", data.tenant_id);

    // Link user to tenant
    await supabase
      .from("users")
      .update({ tenant_id: data.tenant_id })
      .eq("id", userId);

    toast.success("Onboarding concluido! Bem-vindo.");
    router.push("/client");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            Passo {step + 1} de {STEPS.length}
          </span>
          <span className="text-neutral-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex-1 text-center text-[10px] py-1 rounded transition-colors ${
                i === step
                  ? "text-orange-400 font-medium"
                  : i < step
                  ? "text-neutral-500 cursor-pointer hover:text-neutral-400"
                  : "text-neutral-700"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">{STEPS[step].title}</h2>
        <p className="text-sm text-neutral-500 mt-1">{STEPS[step].description}</p>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        {step === 0 && (
          <StepEmpresa data={data} updateData={updateData} />
        )}
        {step === 1 && (
          <StepVisual data={data} updateData={updateData} />
        )}
        {step === 2 && (
          <StepVoz data={data} updateData={updateData} />
        )}
        {step === 3 && (
          <StepConteudo data={data} updateData={updateData} />
        )}
        {step === 4 && (
          <StepFotos data={data} updateData={updateData} />
        )}
        {step === 5 && (
          <StepInstagram data={data} updateData={updateData} />
        )}
        {step === 6 && (
          <StepConfirmacao data={data} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          className="text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="size-4 mr-1" />
          Voltar
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={next}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
          >
            Proximo
            <ArrowRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={complete}
            disabled={completing}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
          >
            {completing ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <Check className="size-4 mr-1" />
            )}
            Confirmar e Comecar
          </Button>
        )}
      </div>
    </div>
  );
}
