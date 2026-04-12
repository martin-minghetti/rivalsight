"use client";

import { useEffect, useState } from "react";

interface Feedback {
  message: string;
  ok: boolean;
}

function useSectionFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const show = (message: string, ok: boolean) => {
    setFeedback({ message, ok });
    setTimeout(() => setFeedback(null), 4000);
  };

  return { feedback, show };
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [cronEnabled, setCronEnabled] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 */6 * * *");
  const [loadingSettings, setLoadingSettings] = useState(true);

  const apiFeedback = useSectionFeedback();
  const webhookFeedback = useSectionFeedback();
  const scheduleFeedback = useSectionFeedback();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.anthropic_api_key) setApiKey(data.anthropic_api_key);
        if (data.webhook_url) setWebhookUrl(data.webhook_url);
        if (data.cron_enabled) setCronEnabled(data.cron_enabled === "true");
        if (data.cron_expression) setCronExpression(data.cron_expression);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const saveApiKey = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "anthropic_api_key", value: apiKey }),
    });
    const data = await res.json();
    if (res.ok) {
      apiFeedback.show("API key saved and verified.", true);
    } else {
      apiFeedback.show(data.error ?? "Failed to save API key.", false);
    }
  };

  const saveWebhook = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "webhook_url", value: webhookUrl }),
    });
    const data = await res.json();
    if (res.ok) {
      webhookFeedback.show("Webhook URL saved.", true);
    } else {
      webhookFeedback.show(data.error ?? "Failed to save webhook.", false);
    }
  };

  const saveSchedule = async () => {
    const [res1, res2] = await Promise.all([
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cron_enabled", value: String(cronEnabled) }),
      }),
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cron_expression", value: cronExpression }),
      }),
    ]);
    if (res1.ok && res2.ok) {
      scheduleFeedback.show("Schedule saved.", true);
    } else {
      scheduleFeedback.show("Failed to save schedule.", false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Configure your API key for live monitoring, set up webhook notifications, and schedule automatic runs.</p>

      {/* API Key */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Anthropic API Key</h2>
          <p className="text-xs text-gray-500 mt-1">
            Without an API key the app runs in demo mode with pre-computed sample data. Add your <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">Anthropic API key</a> to enable live extraction — Claude will analyze competitor pages and return structured pricing, features, and positioning data. The key is validated with a test call on save.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={saveApiKey}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save &amp; Test
          </button>
        </div>
        {apiFeedback.feedback && (
          <p
            className={`text-xs ${
              apiFeedback.feedback.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {apiFeedback.feedback.message}
          </p>
        )}
      </div>

      {/* Webhook */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Webhook URL</h2>
          <p className="text-xs text-gray-500 mt-1">
            Get notified instantly when threats are detected. When a medium, high, or critical alert fires, RivalSight sends a POST request with the full alert payload (competitor, change, threat level) to your URL. Works with Slack incoming webhooks, Discord webhooks, Zapier, or any HTTP endpoint.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-site.com/webhook"
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={saveWebhook}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
        {webhookFeedback.feedback && (
          <p
            className={`text-xs ${
              webhookFeedback.feedback.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {webhookFeedback.feedback.message}
          </p>
        )}
      </div>

      {/* Scheduling */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Scheduling</h2>
          <p className="text-xs text-gray-500 mt-1">
            Set it and forget it — the monitor checks all active targets automatically on your chosen frequency. Requires the app process to be running.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cronEnabled}
            onChange={(e) => setCronEnabled(e.target.checked)}
            className="rounded border-gray-300 w-4 h-4"
          />
          <span className="text-sm text-gray-700">Enable scheduled monitoring</span>
        </label>
        {cronEnabled && (
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Check every</label>
            <select
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0 * * * *">1 hour</option>
              <option value="0 */3 * * *">3 hours</option>
              <option value="0 */6 * * *">6 hours</option>
              <option value="0 */12 * * *">12 hours</option>
              <option value="0 0 * * *">24 hours</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={saveSchedule}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
        {scheduleFeedback.feedback && (
          <p
            className={`text-xs ${
              scheduleFeedback.feedback.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {scheduleFeedback.feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}
