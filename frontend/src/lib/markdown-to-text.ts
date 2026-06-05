export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```\w*\n?/, "").replace(/\n?```/, "")
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+(.+)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
