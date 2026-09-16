export async function extractCvText(
  mime: string,
  content: Uint8Array,
): Promise<string> {
  if (mime === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(content) });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  if (mime.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer: Buffer.from(content) }))
      .value;
  }
  return Buffer.from(content).toString("utf8");
}
