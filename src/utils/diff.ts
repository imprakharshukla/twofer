export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

export function diffText(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const m = aLines.length;
  const n = bLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = m;
  let j = n;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      stack.push({ type: "same", text: aLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", text: bLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", text: aLines[i - 1] });
      i--;
    }
  }

  stack.reverse();
  result.push(...stack);

  return result;
}

export function formatDiff(lines: DiffLine[]): string {
  return lines
    .map((line) => {
      switch (line.type) {
        case "added":
          return `+ ${line.text}`;
        case "removed":
          return `- ${line.text}`;
        default:
          return `  ${line.text}`;
      }
    })
    .join("\n");
}
