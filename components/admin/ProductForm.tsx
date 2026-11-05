"use client";

import { useActionState } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/products/actions";
import Loading from "@/components/icons/Loading";
import { btnPrimary, card, input, label } from "@/components/ui/styles";
import type { AdminProduct } from "@/lib/admin-products";
import { CATEGORIES, CATEGORY_LABELS, UNITS } from "@/lib/data/products";
import { VEGETABLES } from "@/lib/data/vegetables";

type ProductFormProps = {
  /** Absent when creating */
  product?: AdminProduct;
  /** The planner or a guide relies on it: it cannot be hidden */
  isProtected?: boolean;
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-red-700">
      {message}
    </p>
  ) : null;
}

const LANG_FIELDS = [
  { key: "en", label: "English name", required: true },
  { key: "si", label: "Sinhala name (සිංහල)", required: false },
  { key: "ta", label: "Tamil name (தமிழ்)", required: false },
] as const;

export default function ProductForm({ product, isProtected = false }: ProductFormProps) {
  const mode = product ? "update" : "create";
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct.bind(null, mode),
    {}
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className={`${card} space-y-5`} noValidate>
      {errors.form && (
        <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">
          {errors.form}
        </p>
      )}
      {state.saved && (
        <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Saved. The shop shows the change now.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="id" className={label}>
            Product ID
          </label>
          {product ? (
            <>
              <input id="id" className={`${input} opacity-70`} value={product.id} readOnly />
              <input type="hidden" name="id" value={product.id} />
              <p className="mt-1 text-xs text-gray-500">
                The ID cannot change: the product code customers quote comes from it.
              </p>
            </>
          ) : (
            <>
              <input
                id="id"
                name="id"
                className={input}
                placeholder="e.g. f_compost"
                autoComplete="off"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Start with a short category prefix and an underscore (s_, sd_, k_, f_, t_…). It becomes the product code
                (f_compost → F-COMPOST) and cannot be changed later.
              </p>
            </>
          )}
          <FieldError message={errors.id} />
        </div>

        <div>
          <label htmlFor="category" className={label}>
            Category
          </label>
          <select
            id="category"
            name="category"
            className={input}
            defaultValue={product?.category ?? "seedlings"}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className={label}>Name</legend>
        {LANG_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`name_${field.key}`} className="mb-1 block text-xs text-gray-600">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            <input
              id={`name_${field.key}`}
              name={`name_${field.key}`}
              className={input}
              defaultValue={product?.name[field.key] ?? ""}
              required={field.required}
            />
          </div>
        ))}
        <FieldError message={errors.name} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className={label}>
            Price (LKR)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={input}
            defaultValue={product?.price ?? ""}
            required
          />
          <FieldError message={errors.price} />
        </div>

        <div>
          <label htmlFor="unit" className={label}>
            Unit
          </label>
          <select id="unit" name="unit" className={input} defaultValue={product?.unit ?? "each"}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <FieldError message={errors.unit} />
        </div>

        <div>
          <label htmlFor="icon" className={label}>
            Emoji
          </label>
          <input
            id="icon"
            name="icon"
            className={input}
            defaultValue={product?.icon ?? "🌱"}
            maxLength={16}
          />
          <p className="mt-1 text-xs text-gray-500">Shown when there is no photo.</p>
          <FieldError message={errors.icon} />
        </div>
      </div>

      <div>
        <label htmlFor="vegId" className={label}>
          Linked vegetable (seedlings)
        </label>
        <select id="vegId" name="vegId" className={input} defaultValue={product?.vegId ?? ""}>
          <option value="">None</option>
          {VEGETABLES.map((veg) => (
            <option key={veg.id} value={veg.id}>
              {veg.name.en}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          The planner buys this seedling for the vegetable, and the shop links it to its grow guide.
        </p>
        <FieldError message={errors.vegId} />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
            disabled={isProtected}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Show in the shop
        </label>
        {/* A disabled checkbox is not submitted; a protected product stays on sale */}
        {isProtected && <input type="hidden" name="active" value="on" />}
        {isProtected && (
          <p className="mt-1 text-xs text-gray-500">
            The planner or a grow guide uses this product, so it is always shown.
          </p>
        )}
        <FieldError message={errors.active} />
      </div>

      <button type="submit" className={btnPrimary} disabled={pending}>
        {pending && <Loading size="small" color="white" />}
        {product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
