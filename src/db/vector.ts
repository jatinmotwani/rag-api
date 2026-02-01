export function toPgVectorLiteral(values: number[]): string {
  const clean = values.map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error("Embedding contains non-finite values.");
    }
    return value.toString();
  });
  return `[${clean.join(",")}]`;
}
