import { requireUser } from "@/lib/auth";
import { getKomtiView } from "@/lib/queries";
import KomtiConsole from "./console";

export const metadata = { title: "Class Ops · ClassPause" };

export default async function KomtiPage() {
  const user = await requireUser(["komti"]);
  const view = await getKomtiView(user.id);
  return <KomtiConsole {...view} />;
}
