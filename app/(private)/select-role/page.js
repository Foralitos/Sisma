import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";
import RoleSelector from "./RoleSelector";

const EMERGENCY_ROLES = ["hospital", "ambulancia", "policia", "bomberos"];

export const dynamic = "force-dynamic";

export default async function SelectRolePage() {
  const session = await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  // Already has a service role — skip to dashboard
  if (EMERGENCY_ROLES.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <RoleSelector />;
}
