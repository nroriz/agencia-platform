"use client";

import { useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl shadow-2xl">
      <form action={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-neutral-300">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="voce@email.com"
            className="h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-neutral-600 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-neutral-300">
            Senha
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-neutral-600 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/20"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </div>
  );
}
