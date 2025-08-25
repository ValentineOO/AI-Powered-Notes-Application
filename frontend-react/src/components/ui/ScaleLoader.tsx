import React from "react";

interface ScaleLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const ScaleLoader: React.FC<ScaleLoaderProps> = ({
  size = "md",
  color = "currentColor",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 ${sizeClasses[size]}`}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${dotSizeClasses[size]} rounded-full bg-current animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "1s",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }}
        />
      ))}
    </div>
  );
};

export default ScaleLoader;
