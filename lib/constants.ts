// Jumlah hari tanpa update sebelum tugas ditandai "mangkrak".
// Ubah angka ini saja untuk mengubah ambang batasnya.
export const STALE_DAYS_THRESHOLD = 3;

export const STATUS_VALUES = ["belum_mulai", "dikerjakan", "selesai"] as const;
export type TaskStatus = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  belum_mulai: "Belum Mulai",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
};
