import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OrdersList from "@/components/account/OrdersList";
import { loadOrders } from "@/lib/supabase/account";
import { getServerUser } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

export default async function OrdersPage() {
  // Guests see their device's orders on the account page
  const user = await getServerUser();
  if (!user) redirect("/account");

  return <OrdersList orders={await loadOrders(user.uid)} />;
}
