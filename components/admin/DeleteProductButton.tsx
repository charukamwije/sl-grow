"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeProduct } from "@/app/admin/products/actions";
import Loading from "@/components/icons/Loading";
import { btnDanger } from "@/components/ui/styles";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (
      !window.confirm(
        `Delete ${name} for good? It leaves the shop and every cart. Past orders keep their copy. To take it off sale for now, untick "Show in the shop" instead.`
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await removeProduct(id);
      if (result.ok) router.push("/admin/products");
      else setError(result.error);
    });
  };

  return (
    <div>
      <button type="button" className={btnDanger} onClick={onClick} disabled={pending}>
        {pending && <Loading size="small" color="red" />}
        Delete product
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
