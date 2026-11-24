import { requireUser } from "@/lib/auth";
import { getStudentView } from "@/lib/queries";
import StudentBoard from "./board";

export const metadata = { title: "Radar · ClassPause" };

export default async function StudentPage() {
  const user = await requireUser(["student", "komti"]);
  const view = await getStudentView(user.id);
  return <StudentBoard firstName={user.name.split(" ")[0]} {...view} />;
}
