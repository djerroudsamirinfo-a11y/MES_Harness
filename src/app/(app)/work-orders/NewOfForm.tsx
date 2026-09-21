"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function NewOfForm({ articles }: { articles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState(articles[0]?.id || "");
  const [quantity, setQuantity] = useState(10);
  const [priority, setPriority] = useState(5);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, quantity, priority, dueDate: dueDate || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur");
      return;
    }
    const of = await res.json();
    router.push(`/work-orders/${of.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label>Article</label>
        <select className="w-full" value={articleId} onChange={(e) => setArticleId(e.target.value)} required>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Quantité</label>
        <input
          type="number"
          min={1}
          className="w-full"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <label>Priorité (1=haute)</label>
        <input
          type="number"
          min={1}
          max={9}
          className="w-full"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Échéance</label>
        <input type="date" className="w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="flex items-end sm:col-span-3">
        {error && <span className="mr-3 text-sm text-red-600">{error}</span>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Création…" : "Créer l'OF"}
        </button>
      </div>
    </form>
  );
}
