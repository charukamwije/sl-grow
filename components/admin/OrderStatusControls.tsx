"use client";

import { useState, useTransition } from "react";
import { setOrderPaid, setOrderStatus } from "@/app/admin/orders/actions";
import { label } from "@/components/ui/styles";
import {
  ORDER_STATUSES,
  statusLabel,
  type CheckoutMethod,
  type OrderStatus,
} from "@/lib/order/checkout";
import { isNotifyStatus } from "@/lib/order/whatsapp";
import NotifyCustomer, { type NotifyLinks } from "./NotifyCustomer";

type OrderStatusControlsProps = {
  id: string;
  status: OrderStatus;
  method: CheckoutMethod;
  paid: boolean;
  /** Messages for the customer, offered for the status the order is in */
  notify: NotifyLinks;
};

const select =
  "w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60";

// Ending an order is the change worth a second look
const CONFIRM: Partial<Record<OrderStatus, string>> = {
  completed: "Mark this order completed? The customer sees it as done.",
  cancelled: "Cancel this order? The customer sees it as cancelled.",
};

export default function OrderStatusControls({
  id,
  status,
  method,
  paid,
  notify,
}: OrderStatusControlsProps) {
  const [current, setCurrent] = useState(status);
  const [isPaid, setIsPaid] = useState(paid);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changeStatus = (next: OrderStatus) => {
    if (next === current) return;
    const question = CONFIRM[next];
    if (question && !window.confirm(question)) return;

    const previous = current;
    setCurrent(next);
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const result = await setOrderStatus(id, next);
      if (result.ok) setSaved(`Status set to ${statusLabel(next, method)}.`);
      else {
        setCurrent(previous);
        setError(result.error);
      }
    });
  };

  const changePaid = (next: boolean) => {
    if (next === isPaid) return;
    setIsPaid(next);
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const result = await setOrderPaid(id, next);
      if (result.ok) setSaved(next ? "Marked paid." : "Marked unpaid.");
      else {
        setIsPaid(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="order-status" className={label}>
            Order status
          </label>
          <select
            id="order-status"
            className={select}
            value={current}
            disabled={pending}
            onChange={(event) => changeStatus(event.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option, method)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="order-paid" className={label}>
            Payment
          </label>
          <select
            id="order-paid"
            className={select}
            value={isPaid ? "paid" : "unpaid"}
            disabled={pending}
            onChange={(event) => changePaid(event.target.value === "paid")}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
      {saved && (
        <p role="status" className="text-sm text-emerald-700">
          {saved} The customer sees it now.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {isNotifyStatus(current) && !pending && (
        <NotifyCustomer links={notify[current]} statusName={statusLabel(current, method)} />
      )}
    </div>
  );
}
