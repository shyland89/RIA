export const DATE_MODES = ["closed_date", "pipeline_accepted_date", "created_at"] as const;
export type DateMode = (typeof DATE_MODES)[number];

export const PERIODS = ["7d", "30d", "90d", "mtd", "qtd", "custom"] as const;
export type Period = (typeof PERIODS)[number];

export const DATE_MODE_LABELS: Record<DateMode, string> = {
  closed_date: "Closed Date",
  pipeline_accepted_date: "Pipeline Accepted Date",
  created_at: "Created Date",
};

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  mtd: "Month to date",
  qtd: "Quarter to date",
  custom: "Custom range",
};

export type DateFilterParams = {
  dateMode: DateMode;
  period: Period;
  from?: string;
  to?: string;
};

export type ResolvedDateFilter = {
  dateField: DateMode;
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function quarterStart(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

export function resolveDateFilter(params: DateFilterParams): ResolvedDateFilter {
  const now = new Date();
  const dateField = DATE_MODES.includes(params.dateMode) ? params.dateMode : "created_at";
  const period = PERIODS.includes(params.period) ? params.period : "30d";

  let dateFrom: Date;
  let dateTo: Date = endOfDay(now);

  switch (period) {
    case "7d":
      dateFrom = startOfDay(new Date(now.getTime() - 7 * 86400000));
      break;
    case "30d":
      dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
      break;
    case "90d":
      dateFrom = startOfDay(new Date(now.getTime() - 90 * 86400000));
      break;
    case "mtd":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "qtd":
      dateFrom = quarterStart(now);
      break;
    case "custom":
      dateFrom = params.from ? startOfDay(new Date(params.from)) : startOfDay(new Date(now.getTime() - 30 * 86400000));
      dateTo = params.to ? endOfDay(new Date(params.to)) : endOfDay(now);
      if (isNaN(dateFrom.getTime())) dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
      if (isNaN(dateTo.getTime())) dateTo = endOfDay(now);
      break;
    default:
      dateFrom = startOfDay(new Date(now.getTime() - 30 * 86400000));
  }

  return {
    dateField,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    periodLabel: period === "custom"
      ? `${dateFrom.toLocaleDateString()} – ${dateTo.toLocaleDateString()}`
      : PERIOD_LABELS[period],
  };
}

export function parseDateFilterFromSearchParams(params: URLSearchParams): DateFilterParams {
  return {
    dateMode: (params.get("date_mode") as DateMode) || "created_at",
    period: (params.get("period") as Period) || "30d",
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
  };
}
