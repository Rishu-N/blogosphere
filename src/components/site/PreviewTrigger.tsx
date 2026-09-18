"use client";

import type { ReactNode } from "react";
import { usePreview } from "./PreviewContext";

export default function PreviewTrigger({
  articleId,
  className,
  children,
}: {
  articleId: string;
  className?: string;
  children?: ReactNode;
}) {
  const { openPreview } = usePreview();
  return (
    <button type="button" onClick={() => openPreview(articleId)} className={className}>
      {children ?? "Preview"}
    </button>
  );
}
