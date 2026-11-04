"use server";

import { revalidatePath } from "next/cache";
import { updateOrderPaid, updateOrderStatus } from "@/lib/admin-orders";
import { isOrderStatus } from "@/lib/order/checkout";
import { audit, authorizeAction, type ActionResult } from "@/lib/supabase/admin-auth";

function refresh(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  // The customer's own view of the order
  revalidatePath(`/account/orders/${id}`);
  revalidatePath("/account");
}

/** Moves an order to another status (admins and super admins) */
export async function setOrderStatus(id: unknown, status: unknown): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id || !isOrderStatus(status)) {
    return { ok: false, error: "Choose an order and a status." };
  }

  try {
    if (!(await updateOrderStatus(id, status, auth.user.uid))) {
      return { ok: false, error: "This order no longer exists." };
    }
  } catch (error) {
    console.error("Order status error:", error);
    return { ok: false, error: "Failed to change the status." };
  }

  await audit(auth.user, "order.status_changed", id, { status });
  refresh(id);

  return { ok: true };
}

/** Marks an order paid or unpaid (admins and super admins) */
export async function setOrderPaid(id: unknown, paid: unknown): Promise<ActionResult> {
  const auth = await authorizeAction("admin");
  if (!auth.user) return { ok: false, error: auth.error };

  if (typeof id !== "string" || !id || typeof paid !== "boolean") {
    return { ok: false, error: "Choose an order and whether it is paid." };
  }

  try {
    if (!(await updateOrderPaid(id, paid, auth.user.uid))) {
      return { ok: false, error: "This order no longer exists." };
    }
  } catch (error) {
    console.error("Order payment error:", error);
    return { ok: false, error: "Failed to change the payment." };
  }

  await audit(auth.user, paid ? "order.marked_paid" : "order.marked_unpaid", id);
  refresh(id);

  return { ok: true };
}
