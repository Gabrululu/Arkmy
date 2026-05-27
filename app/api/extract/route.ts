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
      // pdfjs-dist v5 (used by pdf-parse v2) references DOMMatrix at module load
      // time. Node.js does not provide it, so we polyfill before the dynamic import.
      if (typeof globalThis.DOMMatrix === "undefined") {
        // @ts-ignore
        globalThis.DOMMatrix = class DOMMatrix {
          a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
          m11 = 1; m12 = 0; m13 = 0; m14 = 0
          m21 = 0; m22 = 1; m23 = 0; m24 = 0
          m31 = 0; m32 = 0; m33 = 1; m34 = 0
          m41 = 0; m42 = 0; m43 = 0; m44 = 1
          is2D = true; isIdentity = true
          constructor(init?: number[] | string) {
            if (Array.isArray(init) && init.length >= 6) {
              [this.a, this.b, this.c, this.d, this.e, this.f] = init
              this.m11 = this.a; this.m12 = this.b
              this.m21 = this.c; this.m22 = this.d
              this.m41 = this.e; this.m42 = this.f
            }
          }
          multiply(m: any) {
            return new (globalThis.DOMMatrix as any)([
              this.a * m.a + this.c * m.b,
              this.b * m.a + this.d * m.b,
              this.a * m.c + this.c * m.d,
              this.b * m.c + this.d * m.d,
              this.a * m.e + this.c * m.f + this.e,
              this.b * m.e + this.d * m.f + this.f,
            ])
          }
          inverse() {
            const det = this.a * this.d - this.b * this.c
            if (det === 0) return new (globalThis.DOMMatrix as any)()
            return new (globalThis.DOMMatrix as any)([
              this.d / det, -this.b / det,
              -this.c / det, this.a / det,
              (this.c * this.f - this.d * this.e) / det,
              (this.b * this.e - this.a * this.f) / det,
            ])
          }
          transformPoint(p: { x: number; y: number }) {
            return { x: this.a * p.x + this.c * p.y + this.e, y: this.b * p.x + this.d * p.y + this.f }
          }
          static fromMatrix(m: any) { return new (globalThis.DOMMatrix as any)(m) }
          static fromFloat32Array(a: Float32Array) { return new (globalThis.DOMMatrix as any)(Array.from(a)) }
          static fromFloat64Array(a: Float64Array) { return new (globalThis.DOMMatrix as any)(Array.from(a)) }
        }
      }
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
