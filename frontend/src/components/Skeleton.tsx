import clsx from "clsx";
import type { CSSProperties } from "react";

interface Props {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: Props) {
  return (
    <div
      className={clsx("animate-pulse rounded bg-white/[0.04]", className)}
      style={style}
    />
  );
}
