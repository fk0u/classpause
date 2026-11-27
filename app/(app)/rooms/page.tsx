import { requireUser } from "@/lib/auth";
import { getOpenRooms, getReports } from "@/lib/rooms";
import { getDict } from "@/lib/i18n/server";
import { db, schema as s } from "@/db";
import RoomsView from "./view";

export async function generateMetadata() {
  return { title: `${(await getDict()).nav.rooms} · ClassPause` };
}

export default async function RoomsPage() {
  const user = await requireUser();
  const [slots, reports, rooms] = await Promise.all([getOpenRooms(user.id), getReports(), db.select({ code: s.rooms.code }).from(s.rooms)]);
  return <RoomsView slots={slots} reports={reports} places={[...rooms.map((r) => r.code).sort(), "Parking A", "Parking B", "Parking C"]} canResolve={user.role !== "student"} />;
}
