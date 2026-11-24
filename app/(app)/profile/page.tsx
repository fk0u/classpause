import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/queries";
import { getDict } from "@/lib/i18n/server";
import { pushConfigured } from "@/lib/notify";
import ProfileView from "./view";

export async function generateMetadata() {
  return { title: `${(await getDict()).nav.profile} · ClassPause` };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <ProfileView
      user={{ name: user.name, email: user.email, role: user.role, studentNo: user.studentNo }}
      profile={profile}
      push={{ configured: pushConfigured, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "" }}
    />
  );
}
