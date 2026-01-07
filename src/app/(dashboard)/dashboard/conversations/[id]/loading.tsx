import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ConversationDetailLoading() {
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[70%] ${i % 2 === 0 ? "" : "text-right"}`}>
                <Skeleton
                  className={`h-16 w-64 rounded-xl ${
                    i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"
                  }`}
                />
                <Skeleton className="h-3 w-16 mt-1 ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="flex-1 h-10 rounded-lg" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Card className="w-80 flex-shrink-0 p-4 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-3">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
