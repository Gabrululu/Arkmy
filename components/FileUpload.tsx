"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import type { FileRejection } from "react-dropzone"

interface FileUploadProps {
  onFileExtracted: (text: string, fileName: string, wasTruncated: boolean) => void
  onError: (msg: string) => void
  disabled?: boolean
}

export function FileUpload({ onFileExtracted, onError, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadingName, setUploadingName] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setUploadingName(file.name)

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/extract", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) {
          onError(data.error || "Failed to extract text")
          return
        }
        onFileExtracted(data.text, data.fileName, data.wasTruncated)
      } catch {
        onError("Network error — could not reach the extraction service")
      } finally {
        setUploading(false)
        setUploadingName(null)
      }
    },
    [onFileExtracted, onError],
  )

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const first = rejections[0]
      if (!first) return
      const code = first.errors[0]?.code
      if (code === "file-too-large") {
        onError("File exceeds 10 MB limit")
      } else if (code === "file-invalid-type") {
        onError(`Unsupported type: ${first.file.name}. Use PDF, DOCX, or TXT`)
      } else {
        onError(first.errors[0]?.message ?? "File rejected")
      }
    },
    [onError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: disabled || uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative flex items-center justify-center px-4 py-3 border border-dashed cursor-pointer transition-colors ${
        isDragActive
          ? "border-[#6b6b6b] bg-[#1a1a1a]"
          : uploading
            ? "border-[#3d3d3d] bg-[#141414]"
            : "border-[#2a2a2a] hover:border-[#3d3d3d] bg-[#141414]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
        {uploading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-[#3d3d3d] border-t-[#f0ede8] rounded-full animate-spin flex-shrink-0" />
            <span className="truncate max-w-[200px]">
              Reading {uploadingName ?? "file"}…
            </span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {isDragActive ? "Drop file here…" : "PDF, DOCX, TXT — max 10MB"}
          </>
        )}
      </div>
    </div>
  )
}
