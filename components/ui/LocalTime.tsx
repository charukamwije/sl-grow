"use client";

import { useSyncExternalStore } from "react";

type LocalTimeProps = {
  /** ISO timestamp */
  value: string;
  /** Date only, without the time of day */
  dateOnly?: boolean;
  className?: string;
};

const subscribe = () => () => {};

// ISO timestamps are UTC; the server cannot know the viewer's timezone
function utcLabel(value: string, dateOnly: boolean): string {
  return dateOnly ? value.slice(0, 10) : `${value.slice(0, 16).replace("T", " ")} UTC`;
}

function localLabel(value: string, dateOnly: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: dateOnly ? undefined : "short",
  }).format(date);
}

/**
 * A timestamp in the browser's own timezone and format. The server renders
 * the UTC label and the browser swaps in its local one after hydration, so
 * the two never disagree during it.
 */
export default function LocalTime({ value, dateOnly = false, className }: LocalTimeProps) {
  const text = useSyncExternalStore(
    subscribe,
    () => localLabel(value, dateOnly),
    () => utcLabel(value, dateOnly)
  );

  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
