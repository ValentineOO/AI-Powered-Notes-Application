const NoteSkeleton = () => {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title skeleton */}
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>

          {/* Content skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          </div>

          {/* Date skeleton */}
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-1 ml-2">
          <div className="w-8 h-8 bg-slate-200 rounded"></div>
          <div className="w-8 h-8 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default NoteSkeleton;
