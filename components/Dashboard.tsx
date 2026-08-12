"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/db";
import { STATUS_LABELS, STATUS_VALUES, STALE_DAYS_THRESHOLD, TaskStatus } from "@/lib/constants";

const POLL_INTERVAL_MS = 15000;

const STATUS_STYLES: Record<TaskStatus, { active: string; idle: string }> = {
  belum_mulai: {
    active: "bg-gray-500 text-white border-gray-500",
    idle: "bg-white text-gray-600 border-gray-300",
  },
  dikerjakan: {
    active: "bg-yellow-400 text-yellow-950 border-yellow-400",
    idle: "bg-white text-yellow-700 border-yellow-300",
  },
  selesai: {
    active: "bg-green-500 text-white border-green-500",
    idle: "bg-white text-green-700 border-green-300",
  },
};

function daysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function formatUpdatedAt(dateString: string): string {
  const days = daysSince(dateString);
  if (days <= 0) return "Diperbarui hari ini";
  if (days === 1) return "Diperbarui 1 hari lalu";
  return `Diperbarui ${days} hari lalu`;
}

function isStale(task: Task): boolean {
  return task.status !== "selesai" && daysSince(task.updated_at) > STALE_DAYS_THRESHOLD;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("belum_mulai");

  async function fetchTasks(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setError(null);
    } catch (e) {
      setError("Tidak bisa memuat data tugas. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks(true);
    const interval = setInterval(() => fetchTasks(false), POLL_INTERVAL_MS);
    const onFocus = () => fetchTasks(false);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const existingAssignees = useMemo(() => {
    const names = new Set(tasks.map((t) => t.assignee));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.assignee) ?? [];
      list.push(task);
      map.set(task.assignee, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);

  const summary = useMemo(() => {
    const staleCount = tasks.filter(isStale).length;
    return {
      total: tasks.length,
      staleCount,
    };
  }, [tasks]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedAssignee = assignee.trim();
    if (!trimmedTitle || !trimmedAssignee) {
      setFormError("Nama tugas dan nama penanggung jawab wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, assignee: trimmedAssignee, status: initialStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menambah tugas.");
      }
      setTitle("");
      setAssignee("");
      setInitialStatus("belum_mulai");
      setShowForm(false);
      await fetchTasks(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambah tugas.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status, updated_at: new Date().toISOString() } : t)));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchTasks(false);
    } catch {
      setError("Gagal mengubah status. Silakan coba lagi.");
      fetchTasks(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Papan Status Tugas Tim</h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-500">
            {summary.total} tugas
            {summary.staleCount > 0 && (
              <span className="ml-2 font-medium text-red-600">
                &middot; {summary.staleCount} mangkrak (&gt;{STALE_DAYS_THRESHOLD} hari)
              </span>
            )}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Memuat data tugas...</p>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-gray-500">
          Belum ada tugas. Tambahkan tugas pertama tim Anda.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([assigneeName, groupTasks]) => (
            <section key={assigneeName} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <h2 className="font-semibold text-gray-800">{assigneeName}</h2>
                <span className="text-xs text-gray-400">{groupTasks.length} tugas</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {groupTasks.map((task) => {
                  const stale = isStale(task);
                  return (
                    <li
                      key={task.id}
                      className={`px-4 py-3 ${stale ? "bg-red-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {stale && (
                          <span title={`Belum diupdate lebih dari ${STALE_DAYS_THRESHOLD} hari`} className="shrink-0 text-lg leading-none">
                            ⚠️
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs ${stale ? "font-medium text-red-600" : "text-gray-400"}`}>
                        {formatUpdatedAt(task.updated_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {STATUS_VALUES.map((status) => {
                          const active = task.status === status;
                          const style = STATUS_STYLES[status];
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(task, status)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                active ? style.active : style.idle
                              }`}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg active:scale-95"
        aria-label="Tambah tugas"
      >
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleAddTask}
            className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Tugas</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {formError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Nama Tugas</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Buat materi konten IG minggu ini"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Penanggung Jawab</span>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nama orang yang mengerjakan"
                list="assignee-list"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              />
              <datalist id="assignee-list">
                {existingAssignees.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Status Awal</span>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              >
                {STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Simpan Tugas"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
