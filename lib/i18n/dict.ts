/** UI copy. `id` must mirror `en` exactly (enforced by the Dict type). */
const en = {
  locale: "en",
  langName: "English",
  common: {
    signOut: "Sign out", live: "Live", offline: "Offline", students: "students", close: "Close", done: "Done",
    back: "Back", next: "Next", cancel: "Cancel", save: "Save", today: "Today", noClasses: "No classes today. Enjoy the free day 🌴",
    nothingYet: "Nothing yet.", seeAll: "See all", minutes: "min",
  },
  roles: { student: "Student", komti: "Komti", lecturer: "Lecturer" },
  nav: { radar: "Radar", ops: "Class Ops", classes: "My Classes", schedule: "Schedule", inbox: "Inbox", profile: "Profile", design: "Design" },
  status: {
    scheduled: { label: "Scheduled", advice: "Lecturer gets a 1-tap card 2 hours before." },
    pending: { label: "Hold commute", advice: "Waiting for the lecturer. Don’t leave yet." },
    confirmed: { label: "Safe to commute", advice: "Verified by the lecturer. Class is on." },
    delayed: { label: "Delayed 20 min", advice: "Class starts 20 minutes late." },
    reschedule: { label: "Rescheduling", advice: "Komti is locking a conflict-free slot." },
    rescheduled: { label: "Moved", advice: "Class moved. Today’s slot is free." },
    micropause: { label: "Micro-Pause", advice: "Don’t commute. Do the 15-minute module to log attendance." },
  },
  login: {
    title1: "Let’s get your", title2: "class sorted.", lead: "No more guessing whether class is on. Pick a role to step in.",
    note: "Synthetic East Kalimantan campus · campus SSO replaces this in a real rollout", choose: "Choose who you are",
    blurb: { student: "Commute radar, Micro-Pause, leave requests", komti: "SLA timers, slot engine, permission queue", lecturer: "Answer in one tap, never type a reply" },
  },
  student: {
    hi: "Hi {name}", title: "My Commute Radar 🛰️", statToday: "Today", statSafe: "Safe to go", statHold: "On hold", statFreed: "Freed up",
    newSlot: "New slot:", leave: "Leave", pauseKicker: "Micro-Pause · {min} min", pauseLead: "{course}: lecturer is away, so learn here and your attendance is logged.",
    startModule: "▶ Start 15-min module", side: "Today 🧐", semester: "This semester", pausesDone: "Micro-Pause modules completed",
  },
  pause: {
    step: "Step {n} of {total}", quick: "Quick check", submit: "Submit & log attendance", logged: "Attendance logged",
    loggedLead: "Score {c}/{t}. Your komti and lecturer can see this receipt.", receipt: "Receipt",
  },
  leave: {
    title: "Request leave", lead: "{course} · goes straight to your komti’s queue", sick: "Sick", dispensation: "Dispensation",
    reason: "Reason", phSick: "e.g. Fever, clinic letter attached", phDisp: "e.g. Regional debate competition", send: "Send to komti", sent: "Sent to your komti",
  },
  komti: {
    kicker: "Komti · Informatics ’26 Class A", title: "Class Operations 🧭", statClasses: "Classes today", statTimers: "SLA timers",
    statRequests: "Requests", statPauses: "Pauses done", timeline: "Today’s timeline", engineKicker: "Conflict-free slot engine",
    engineTitle: "Pick a new slot for {course}", engineLead: "Checked {n} student timetables, the lecturer’s classes and every room’s bookings.",
    optimal: "Optimal", alt: "Alternative", async: "Async", asyncSub: "15-min module + Q&A thread", clash: "{n} clash", noClash: "0 clashes",
    lock: "Lock & broadcast to {n} students", requests: "Requests 🙋", noRequests: "No requests yet.", decline: "Decline", approve: "Approve",
    excused: "Excused 👏", declined: "Declined", activity: "Activity",
  },
  lecturer: {
    title: "My Classes Today 🎓", lead: "These cards normally reach you on Telegram, WhatsApp or as a push notification. Four options cover every outcome, so you never type a reply.",
    schedule: "Schedule 🗓️", for: "For {name}", tapOnce: "Tap once. Every student sees it on their radar right away.",
    confirm: "Confirm on time", confirmSub: "Green signal to all", delay: "Delay 20 min", delaySub: "Start later",
    reschedule: "Reschedule", rescheduleSub: "3 conflict-free slots", micropause: "Micro-Pause", micropauseSub: "15-min async module",
    linkNote: "Single-use link · no login · expires at H+15m", sentTo: "Sent to {n} students", sentLead: "They see the update on their radar right now. You can close this page.",
    expiredTitle: "This link is no longer active", expiredLead: "It was already used, or the 15-minute window passed and the class moved to Micro-Pause.",
  },
  schedule: { title: "Weekly Schedule 🗓️", lead: "Your recurring timetable. One-off changes show on the radar.", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  inbox: { title: "Inbox 📬", lead: "Everything ClassPause told you, newest first.", markAll: "Mark all read", empty: "You’re all caught up ✨", unread: "{n} unread" },
  profile: {
    title: "My Profile", studentNo: "Student no.", email: "Email", language: "Language", languageLead: "Applies to the app and to notifications you receive.",
    notifications: "Push notifications", notifLead: "Get class status, slot changes and requests even when the app is closed.",
    enable: "Enable", disable: "Turn off", enabled: "Enabled on this device", unsupported: "This browser doesn’t support push notifications.",
    denied: "Notifications are blocked in your browser settings.", notConfigured: "Push isn’t configured on this server yet.", test: "Send test",
    install: "Install app", installLead: "Add ClassPause to your home screen for a full-screen, app-like experience.", installed: "Installed",
    installIos: "On iPhone: tap Share, then “Add to Home Screen”.",
    receipts: "Attendance receipts", noReceipts: "No receipts yet.", stats: "My numbers", statClasses: "Classes", statPauses: "Pauses done", statRequests: "Requests",
  },
  notif: {
    prompt: { title: "Confirm your class", body: "“{course}” starts {time}. Tap once to update {n} students." },
    confirmed: { title: "Safe to commute ✅", body: "{course} is on at {time}." },
    delayed: { title: "Class delayed 20 min", body: "{course} starts 20 minutes late." },
    reschedule: { title: "Class being rescheduled", body: "{course}: your komti is picking a new slot. Don’t commute." },
    micropause: { title: "Micro-Pause instead 🎧", body: "{course}: do the 15-minute module to log attendance." },
    expired: { title: "No reply: Micro-Pause 🎧", body: "{course}: the lecturer didn’t answer by H+15m. Do the 15-minute module." },
    moved: { title: "Class moved 📦", body: "{course} → {when} · {room}" },
    request: { title: "New leave request", body: "{name}: {course}" },
    decision: { title: "Leave request {decision}", body: "{course}" },
    approved: "approved", rejected: "declined",
    test: { title: "ClassPause test 🔔", body: "Push notifications work on this device." },
  },
  demo: { clock: "Demo clock", start: "Start class now", skip: "Skip to H+15m", hint: "Start class · Skip to H+15m", link: "Lecturer magic link (would arrive by push/Telegram):" },
  design: { title: "Design System", lead: "Tokens and components that every ClassPause screen is built from." },
  offline: { title: "You’re offline" },
};

export type Dict = typeof en;
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends readonly string[] ? readonly string[] : DeepString<T[K]> };

const id: DeepString<Dict> = {
  locale: "id",
  langName: "Bahasa Indonesia",
  common: {
    signOut: "Keluar", live: "Live", offline: "Offline", students: "mahasiswa", close: "Tutup", done: "Selesai",
    back: "Kembali", next: "Lanjut", cancel: "Batal", save: "Simpan", today: "Hari ini", noClasses: "Tidak ada kelas hari ini. Nikmati harimu 🌴",
    nothingYet: "Belum ada apa-apa.", seeAll: "Lihat semua", minutes: "mnt",
  },
  roles: { student: "Mahasiswa", komti: "Komti", lecturer: "Dosen" },
  nav: { radar: "Radar", ops: "Operasi Kelas", classes: "Kelas Saya", schedule: "Jadwal", inbox: "Kotak Masuk", profile: "Profil", design: "Desain" },
  status: {
    scheduled: { label: "Terjadwal", advice: "Dosen menerima kartu 1-tap 2 jam sebelumnya." },
    pending: { label: "Tahan berangkat", advice: "Menunggu dosen. Jangan berangkat dulu." },
    confirmed: { label: "Aman berangkat", advice: "Sudah dikonfirmasi dosen. Kelas jalan." },
    delayed: { label: "Mundur 20 mnt", advice: "Kelas mulai 20 menit lebih lambat." },
    reschedule: { label: "Dijadwal ulang", advice: "Komti sedang mengunci slot tanpa bentrok." },
    rescheduled: { label: "Dipindah", advice: "Kelas dipindah. Slot hari ini kosong." },
    micropause: { label: "Micro-Pause", advice: "Jangan berangkat. Kerjakan modul 15 menit untuk absen." },
  },
  login: {
    title1: "Yuk, beresin", title2: "urusan kelasmu.", lead: "Tidak perlu lagi menebak kelas jadi atau tidak. Pilih peranmu untuk masuk.",
    note: "Kampus sintetis Kalimantan Timur · SSO kampus menggantikan ini saat rilis nyata", choose: "Kamu siapa?",
    blurb: { student: "Radar berangkat, Micro-Pause, izin", komti: "Timer SLA, slot engine, antrean izin", lecturer: "Jawab sekali tap, tanpa mengetik" },
  },
  student: {
    hi: "Hai {name}", title: "Radar Berangkat 🛰️", statToday: "Hari ini", statSafe: "Aman", statHold: "Ditahan", statFreed: "Kosong",
    newSlot: "Slot baru:", leave: "Izin", pauseKicker: "Micro-Pause · {min} mnt", pauseLead: "{course}: dosen berhalangan, jadi belajar di sini dan absenmu tercatat.",
    startModule: "▶ Mulai modul 15 menit", side: "Hari ini 🧐", semester: "Semester ini", pausesDone: "modul Micro-Pause selesai",
  },
  pause: {
    step: "Langkah {n} dari {total}", quick: "Cek singkat", submit: "Kirim & catat kehadiran", logged: "Kehadiran tercatat",
    loggedLead: "Skor {c}/{t}. Komti dan dosen bisa melihat bukti ini.", receipt: "Bukti",
  },
  leave: {
    title: "Ajukan izin", lead: "{course} · langsung masuk antrean komti", sick: "Sakit", dispensation: "Dispensasi",
    reason: "Alasan", phSick: "mis. Demam, ada surat klinik", phDisp: "mis. Lomba debat tingkat provinsi", send: "Kirim ke komti", sent: "Terkirim ke komti",
  },
  komti: {
    kicker: "Komti · Informatika ’26 Kelas A", title: "Operasi Kelas 🧭", statClasses: "Kelas hari ini", statTimers: "Timer SLA",
    statRequests: "Izin", statPauses: "Pause selesai", timeline: "Timeline hari ini", engineKicker: "Slot engine tanpa bentrok",
    engineTitle: "Pilih slot baru untuk {course}", engineLead: "Sudah dicek {n} jadwal mahasiswa, kelas dosen, dan semua pemakaian ruang.",
    optimal: "Optimal", alt: "Alternatif", async: "Asinkron", asyncSub: "Modul 15 mnt + thread tanya jawab", clash: "{n} bentrok", noClash: "0 bentrok",
    lock: "Kunci & umumkan ke {n} mahasiswa", requests: "Izin 🙋", noRequests: "Belum ada izin.", decline: "Tolak", approve: "Setujui",
    excused: "Diizinkan 👏", declined: "Ditolak", activity: "Aktivitas",
  },
  lecturer: {
    title: "Kelas Saya Hari Ini 🎓", lead: "Kartu ini biasanya sampai lewat Telegram, WhatsApp, atau notifikasi push. Empat pilihan mencakup semua kemungkinan, jadi Anda tidak perlu mengetik.",
    schedule: "Jadwal 🗓️", for: "Untuk {name}", tapOnce: "Cukup sekali tap. Semua mahasiswa langsung melihatnya.",
    confirm: "Konfirmasi tepat waktu", confirmSub: "Sinyal hijau ke semua", delay: "Mundur 20 mnt", delaySub: "Mulai lebih lambat",
    reschedule: "Jadwal ulang", rescheduleSub: "3 slot tanpa bentrok", micropause: "Micro-Pause", micropauseSub: "Modul asinkron 15 mnt",
    linkNote: "Link sekali pakai · tanpa login · kedaluwarsa di H+15m", sentTo: "Terkirim ke {n} mahasiswa", sentLead: "Mereka melihat pembaruannya sekarang. Halaman ini boleh ditutup.",
    expiredTitle: "Link ini sudah tidak aktif", expiredLead: "Link sudah dipakai, atau jendela 15 menit sudah lewat dan kelas pindah ke Micro-Pause.",
  },
  schedule: { title: "Jadwal Mingguan 🗓️", lead: "Jadwal rutinmu. Perubahan sekali jalan tampil di radar.", days: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] },
  inbox: { title: "Kotak Masuk 📬", lead: "Semua pemberitahuan ClassPause, terbaru di atas.", markAll: "Tandai semua dibaca", empty: "Semua sudah dibaca ✨", unread: "{n} belum dibaca" },
  profile: {
    title: "Profil Saya", studentNo: "NIM", email: "Email", language: "Bahasa", languageLead: "Berlaku untuk aplikasi dan notifikasi yang kamu terima.",
    notifications: "Notifikasi push", notifLead: "Dapatkan status kelas, perubahan slot, dan izin walau aplikasi tertutup.",
    enable: "Aktifkan", disable: "Matikan", enabled: "Aktif di perangkat ini", unsupported: "Browser ini tidak mendukung notifikasi push.",
    denied: "Notifikasi diblokir di pengaturan browser.", notConfigured: "Push belum dikonfigurasi di server ini.", test: "Kirim tes",
    install: "Pasang aplikasi", installLead: "Tambahkan ClassPause ke layar utama untuk tampilan layar penuh seperti aplikasi.", installed: "Terpasang",
    installIos: "Di iPhone: ketuk Bagikan, lalu “Tambah ke Layar Utama”.",
    receipts: "Bukti kehadiran", noReceipts: "Belum ada bukti.", stats: "Angka saya", statClasses: "Kelas", statPauses: "Pause selesai", statRequests: "Izin",
  },
  notif: {
    prompt: { title: "Konfirmasi kelas Anda", body: "“{course}” mulai {time}. Tap sekali untuk memberi tahu {n} mahasiswa." },
    confirmed: { title: "Aman berangkat ✅", body: "{course} jalan pukul {time}." },
    delayed: { title: "Kelas mundur 20 mnt", body: "{course} mulai 20 menit lebih lambat." },
    reschedule: { title: "Kelas dijadwal ulang", body: "{course}: komti sedang memilih slot baru. Jangan berangkat." },
    micropause: { title: "Ganti Micro-Pause 🎧", body: "{course}: kerjakan modul 15 menit untuk absen." },
    expired: { title: "Tanpa jawaban: Micro-Pause 🎧", body: "{course}: dosen tidak menjawab sampai H+15m. Kerjakan modul 15 menit." },
    moved: { title: "Kelas dipindah 📦", body: "{course} → {when} · {room}" },
    request: { title: "Izin baru masuk", body: "{name}: {course}" },
    decision: { title: "Izin {decision}", body: "{course}" },
    approved: "disetujui", rejected: "ditolak",
    test: { title: "Tes ClassPause 🔔", body: "Notifikasi push berfungsi di perangkat ini." },
  },
  demo: { clock: "Jam demo", start: "Mulai kelas sekarang", skip: "Lompat ke H+15m", hint: "Mulai kelas · Lompat ke H+15m", link: "Magic link dosen (biasanya lewat push/Telegram):" },
  design: { title: "Design System", lead: "Token dan komponen yang dipakai semua layar ClassPause." },
  offline: { title: "Kamu sedang offline" },
};

export const DICTS = { en, id: id as Dict };
export type Locale = keyof typeof DICTS;
export const LOCALES: Locale[] = ["en", "id"];
export const isLocale = (v: unknown): v is Locale => v === "en" || v === "id";

/** "{name}" interpolation. */
export function fmt(s: string, vars: Record<string, string | number> = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
