import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "hospital") redirect("/dashboard/hospital");
  if (role === "ambulancia") redirect("/dashboard/ambulancia");
  if (role === "policia") redirect("/dashboard/policia");
  if (role === "bomberos") redirect("/dashboard/bomberos");
  if (role === "ciudadano") redirect("/dashboard/ciudadano");

  // Fallback para admin/editor/moderator
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Dashboard — {role}</h1>
    </main>
  );
}
