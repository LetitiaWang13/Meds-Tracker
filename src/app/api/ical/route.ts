import { NextResponse } from "next/server";

function toIcsDate(dt: Date) {
  // Floating time (no Z) for better local-calendar behavior in MVP.
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    dt.getFullYear().toString() +
    pad(dt.getMonth() + 1) +
    pad(dt.getDate()) +
    "T" +
    pad(dt.getHours()) +
    pad(dt.getMinutes()) +
    "00"
  );
}

export async function GET() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 10);

  const uid = `demo-${start.getTime()}@med-minder`;

  // NOTE: DB-free MVP: we export a demo .ics file. Next step is to generate events
  // from the user's local plan (client-side) and offer a download flow.
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MedMinder//MVP//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:慢病用药提醒（示例）",
    "X-WR-TIMEZONE:Asia/Shanghai",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    "SUMMARY:用药提醒（示例）",
    "DESCRIPTION:这是示例 .ics 导出文件（当前不连数据库）。后续可从本地用药计划生成真实事件。",
    "BEGIN:VALARM",
    "TRIGGER:-PT5M",
    "ACTION:DISPLAY",
    "DESCRIPTION:用药提醒",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": "attachment; filename=\"med-minder-demo.ics\"",
      "cache-control": "no-store"
    }
  });
}

