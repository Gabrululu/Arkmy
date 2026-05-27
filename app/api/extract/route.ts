import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return Response.json({ error: "No file provided" }, { status: 400 })

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let text = ""

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf")
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    const isTxt = file.type.startsWith("text/plain") || file.name.endsWith(".txt")

    if (isPdf) {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: buffer, verbosity: 0 })
      const result = await parser.getText()
      text = result.text
    } else if (isDocx) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (isTxt) {
      text = buffer.toString("utf-8")
    } else {
      return Response.json(
        { error: "Unsupported file type. Accepted: PDF, DOCX, TXT" },
        { status: 400 },
      )
    }

    const CHAR_LIMIT = 80000
    const truncated = text.slice(0, CHAR_LIMIT)
    const wasTruncated = text.length > CHAR_LIMIT

    return Response.json({
      text: truncated,
      wasTruncated,
      charCount: text.length,
      fileName: file.name,
    })
  } catch (err) {
    const msg = err instanceof Error ? `${err.constructor.name}: ${err.message}` : String(err)
    console.error("[extract] Error processing file:", err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
