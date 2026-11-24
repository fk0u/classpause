import { requireUser } from "@/lib/auth";
import { getWeekly } from "@/lib/queries";
import { getDict } from "@/lib/i18n/server";
import WeekView from "./view";

export async function generateMetadata() {
  return { title: `${(await getDict()).nav.schedule} · ClassPause` };
}

export default async function SchedulePage() {
  const user = await requireUser();
  return <WeekView meetings={await getWeekly(user.id, user.role)} />;
}
