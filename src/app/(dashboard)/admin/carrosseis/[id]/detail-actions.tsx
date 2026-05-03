"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveCarousel, rejectCarousel } from "../actions";

interface DetailActionsProps {
  carouselId: string;
}

export function DetailActions({ carouselId }: DetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveCarousel(carouselId);
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectCarousel(carouselId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Check className="size-4 mr-1" />
        {isPending ? "Processando..." : "Aprovar"}
      </Button>
      <Button
        onClick={handleReject}
        disabled={isPending}
        variant="outline"
        className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
      >
        <X className="size-4 mr-1" />
        {isPending ? "Processando..." : "Rejeitar"}
      </Button>
    </div>
  );
}
