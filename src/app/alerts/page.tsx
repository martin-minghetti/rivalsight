"use client";

import { useEffect, useState, useCallback } from "react";
import ThreatBadge from "@/components/ThreatBadge";
import ImpactIcon from "@/components/ImpactIcon";

interface AlertRow {
  id: string;
  title: string;
  threatLevel: string;
  impactType: string;
  isRead: number;
  createdAt: string;
  competitorName: string | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [threatFilter, setThreatFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (unreadOnly) params.set("unread", "true");
    if (threatFilter) params.set("threatLevel", threatFilter);
    const res = await fetch(`/api/alerts?${params.toString()}`);
    const data = await res.json();
    setAlerts(data);
    setLoading(false);
  }, [unreadOnly, threatFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markOne = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: 1 } : a))
    );
  };

  const markAll = async () => {
    await fetch("/api/alerts", { method: "POST" });
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: 1 })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Alerts</h1>
        <button
          onClick={markAll}
          className="text-sm text-blue-600 hover:underline"
        >
          Mark all read
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Unread only
        </label>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Threat</label>
          <select
            value={threatFilter}
            onChange={(e) => setThreatFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No alerts found.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`px-6 py-4 flex items-center gap-4 ${
                  alert.isRead ? "opacity-60" : ""
                }`}
              >
                <ImpactIcon type={alert.impactType} />
                <ThreatBadge level={alert.threatLevel} />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      alert.isRead
                        ? "text-gray-500"
                        : "text-gray-900 font-medium"
                    }`}
                  >
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {alert.competitorName ?? "—"} · {alert.createdAt.slice(0, 10)}
                  </p>
                </div>
                {!alert.isRead && (
                  <button
                    onClick={() => markOne(alert.id)}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
                {alert.isRead && (
                  <span className="text-xs text-gray-400">Read</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
