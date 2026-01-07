"use client";

import { cn } from "@/lib/utils";

interface WhatsAppPreviewProps {
  message: string;
  variables?: Record<string, string>;
  className?: string;
}

export function WhatsAppPreview({ message, variables = {}, className }: WhatsAppPreviewProps) {
  // Replace {{variable}} with actual values or placeholder styling
  const formattedMessage = message.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName];
    if (value) {
      return value;
    }
    return `[${varName}]`;
  });

  return (
    <div className={cn("bg-[#e5ddd5] dark:bg-zinc-800 rounded-lg p-4", className)}>
      <div className="max-w-[280px]">
        <div className="bg-[#dcf8c6] dark:bg-emerald-900 rounded-lg p-3 shadow-sm relative">
          {/* WhatsApp bubble tail */}
          <div className="absolute -right-2 top-0 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] dark:border-t-emerald-900 border-r-[10px] border-r-transparent" />

          <p className="text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap break-words">
            {formattedMessage}
          </p>

          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">12:34</span>
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 16 15" fill="currentColor">
              <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
