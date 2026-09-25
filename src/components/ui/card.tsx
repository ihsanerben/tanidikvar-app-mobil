import { View, type ViewProps } from "react-native";
export function Card({ className = "", ...props }: ViewProps) {
  return (
    <View
      {...props}
      className={
        "gap-3 rounded-card border border-border bg-surface p-4 " + className
      }
    />
  );
}
