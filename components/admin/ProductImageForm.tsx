"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/app/admin/products/actions";
import Loading from "@/components/icons/Loading";
import { btnSecondary, btnSmall, card, subheading } from "@/components/ui/styles";
import type { ActionResult } from "@/lib/supabase/admin-auth";

type ProductImageFormProps = {
  id: string;
  icon: string;
  imageUrl: string | null;
};

export default function ProductImageForm({ id, icon, imageUrl }: ProductImageFormProps) {
  const [state, formAction, uploading] = useActionState<ActionResult | null, FormData>(
    uploadProductImage.bind(null, id),
    null
  );
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();

  const remove = () => {
    if (!window.confirm("Remove this photo? The shop will show the emoji instead.")) return;
    setRemoveError(null);
    startRemoving(async () => {
      const result = await deleteProductImage(id);
      if (!result.ok) setRemoveError(result.error);
    });
  };

  const error = (state && !state.ok ? state.error : null) ?? removeError;

  return (
    <section className={`${card} space-y-4`}>
      <h2 className={subheading}>Photo</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex aspect-[4/3] w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Current product photo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl" aria-label="No photo; the shop shows this emoji">
              {icon}
            </span>
          )}
        </div>

        <form action={formAction} className="space-y-2">
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <p className="text-xs text-gray-500">JPEG, PNG or WebP, up to 2 MB. A 4:3 photo fits best.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnSmall} disabled={uploading}>
              {uploading ? "Uploading…" : imageUrl ? "Replace photo" : "Upload photo"}
            </button>
            {imageUrl && (
              <button type="button" className={btnSecondary} onClick={remove} disabled={removing}>
                {removing && <Loading size="small" />}
                Remove photo
              </button>
            )}
          </div>
        </form>
      </div>

      {state?.ok && !uploading && (
        <p role="status" className="text-sm text-emerald-700">
          Photo saved.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
