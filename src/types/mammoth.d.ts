declare module "mammoth" {
  export type ExtractRawTextResult = {
    value: string;
    messages?: unknown[];
  };

  export function extractRawText(options: {
    path: string;
  }): Promise<ExtractRawTextResult>;

  const mammoth: {
    extractRawText: typeof extractRawText;
  };

  export default mammoth;
}
