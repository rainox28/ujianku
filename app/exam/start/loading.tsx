// app/exam/start/loading.tsx
import { QuestionSkeleton } from "@/components/ui/Skeleton";

export default function ExamLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="hidden sm:block">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-72 bg-gray-200 rounded animate-pulse" />
          </div>

          {[1, 2, 3].map((i) => (
            <QuestionSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
