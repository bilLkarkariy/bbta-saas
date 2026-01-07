import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid gap-6">
        {/* Account Info Card */}
        <div className="rounded-lg border bg-white p-6">
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="rounded-lg border bg-white p-6">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="text-center py-4">
            <Skeleton className="h-4 w-52 mx-auto mb-4" />
            <Skeleton className="h-10 w-40 mx-auto" />
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="rounded-lg border bg-white p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-4 w-72 mb-4" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}
