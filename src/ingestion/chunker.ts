export type TextChunk = {
  text: string;
  tokenCount: number;
  chunkIndex: number;
};

type ChunkOptions = {
  chunkSize: number;
  chunkOverlap: number;
};

export function chunkText(
  text: string,
  options: ChunkOptions = { chunkSize: 800, chunkOverlap: 100 }
): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: TextChunk[] = [];
  const { chunkSize, chunkOverlap } = options;

  let start = 0;
  let index = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push({
      text: chunkWords.join(" "),
      tokenCount: chunkWords.length,
      chunkIndex: index,
    });
    index += 1;
    if (end === words.length) {
      break;
    }
    start = Math.max(0, end - chunkOverlap);
  }

  return chunks;
}
