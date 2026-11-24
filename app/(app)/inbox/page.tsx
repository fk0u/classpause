import { requireUser } from "@/lib/auth";
import { getInbox } from "@/lib/queries";
import { getDict } from "@/lib/i18n/server";
import InboxView from "./view";

export async function generateMetadata() {
  return { title: `${(await getDict()).nav.inbox} · ClassPause` };
}

export default async function InboxPage() {
  const user = await requireUser();
  return <InboxView items={await getInbox(user.id)} />;
}
