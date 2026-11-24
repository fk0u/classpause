import { requireUser } from "@/lib/auth";
import { getLecturerView } from "@/lib/queries";
import LecturerBoard from "./board";

export const metadata = { title: "Lecturer · ClassPause" };

export default async function LecturerPage() {
  const user = await requireUser(["lecturer"]);
  const sessions = await getLecturerView(user.id);
  return <LecturerBoard name={user.name} sessions={sessions} />;
}
