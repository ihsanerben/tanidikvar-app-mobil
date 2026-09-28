import { View, type ViewProps } from "react-native";
export function Card({ className = "", compact = false, ...props }: ViewProps & { compact?: boolean }) {
  return (
    <View
      {...props}
      className={
        "rounded-card border border-border bg-surface " + (compact ? "gap-1.5 p-3 " : "gap-3 p-card-inset ") + className
      }
    />
  );
}
