import { ACTIVITY_LOG_PATH } from "./paths";
import { appendJsonLine, readJsonLines } from "./json-file-store";
import type { ActivityEvent, ActivityLogStore } from "./types";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const activityLogStore: ActivityLogStore = {
  async append(event) {
    await appendJsonLine(ACTIVITY_LOG_PATH, event);
  },

  async readAll() {
    return readJsonLines<ActivityEvent>(ACTIVITY_LOG_PATH);
  },

  async exportCsv() {
    const events = await this.readAll();
    const header = "timestamp,articleId,category,event";
    const rows = events.map((e) => `${e.timestamp},${csvEscape(e.articleId)},${csvEscape(e.category)},${e.event}`);
    return [header, ...rows].join("\n") + "\n";
  },
};
