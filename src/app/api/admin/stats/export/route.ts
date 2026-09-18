import { NextResponse } from "next/server";
import { activityLogStore } from "@/lib/storage/activity-log-store";

export async function GET() {
  const csv = await activityLogStore.exportCsv();
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": 'attachment; filename="activity-log.csv"',
    },
  });
}
