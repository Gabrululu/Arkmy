interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  hasAttachment?: boolean
  fileName?: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, hasAttachment, fileName, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-3`}>
      {!isUser && (
        <div className="w-6 h-6 border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="font-mono text-[10px] text-[#3d9e4a]">A</span>
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 border ${
        isUser
          ? "bg-[#1a1a1a] border-[#2a2a2a]"
          : "bg-[#141414] border-[#1a1a1a]"
      }`}>
        {hasAttachment && fileName && (
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[#2a2a2a]">
            <svg className="w-3.5 h-3.5 text-[#6b6b6b] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-mono text-[#6b6b6b] truncate">{fileName}</span>
          </div>
        )}
        <div className="text-sm text-[#f0ede8] whitespace-pre-wrap leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#e8442a] animate-pulse" />
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-6 h-6 border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="font-mono text-[10px] text-[#6b6b6b]">U</span>
        </div>
      )}
    </div>
  )
}
