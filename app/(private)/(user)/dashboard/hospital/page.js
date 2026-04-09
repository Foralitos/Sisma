import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import HospitalUnit from "@/models/HospitalUnit";
import HospitalSetup from "./HospitalSetup";
import HospitalPanel from "./HospitalPanel";

export const dynamic = "force-dynamic";

export default async function HospitalDashboard() {
  const session = await auth();

  if (!session?.user) redirect("/api/auth/signin");
  if (session.user.role !== "hospital") redirect("/dashboard");

  await connectMongo();
  const unit = await HospitalUnit.findOne({ owner: session.user.id }).lean();

  if (!unit) {
    return <HospitalSetup />;
  }

  // Serializar _id para client component
  return (
    <HospitalPanel
      unit={{
        ...unit,
        _id: unit._id.toString(),
        owner: unit.owner.toString(),
      }}
    />
  );
}
