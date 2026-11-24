import { avatarBg, initials } from "./status";

export function Avatar({ name, size = 40, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-ink ${avatarBg(name)} ${ring ? "ring-4 ring-white" : ""}`}>
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, size = 30 }: { names: string[]; size?: number }) {
  return (
    <span className="flex -space-x-2">
      {names.slice(0, 3).map((n) => <Avatar key={n} name={n} size={size} ring />)}
    </span>
  );
}
