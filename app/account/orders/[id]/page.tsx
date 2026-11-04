import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import OrderView from "@/components/account/OrderView";
import { getBankDetails, hasBankDetails } from "@/lib/shop-settings";
import { loadOwnOrder } from "@/lib/supabase/account";
import { getServerUser } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/account");

  // Someone else's order is a 404, the same as one that does not exist
  const order = await loadOwnOrder(user.uid, (await params).id);
  if (!order) notFound();

  const bank = order.payment === "bank_transfer" ? await getBankDetails() : null;
  const placed = (await searchParams).placed === "1";

  return (
    <OrderView order={order} bank={bank && hasBankDetails(bank) ? bank : null} placed={placed} />
  );
}
