"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveCarousel, rejectCarousel } from "./actions";

interface AprovacaoActionsProps {
  carouselId: string;
}

export function AprovacaoActions({ carouselId }: AprovacaoActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approveCarousel(carouselId);
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectCarousel(carouselId);
    });
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button
        size="sm"
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? "Processando..." : "Aprovar"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? "Processando..." : "Rejeitar"}
      </Button>
    </div>
  );
}
