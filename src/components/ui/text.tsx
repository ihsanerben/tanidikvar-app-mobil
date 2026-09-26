import { Text as NativeText, type TextProps } from "react-native";
import { fontFamily } from "@/lib/theme";
import { cva } from "class-variance-authority";
const styles = cva("text-text", {
  variants: {
    variant: {
      body: "text-body",
      title: "text-page-title font-bold text-primary",
      heading: "text-card-title font-bold text-primary",
      muted: "text-caption text-muted",
      label: "text-body font-semibold",
    },
  },
  defaultVariants: { variant: "body" },
});
export function Text({
  variant = "body",
  className,
  style,
  ...props
}: TextProps & { variant?: "body" | "title" | "heading" | "muted" | "label" }) {
  return (
    <NativeText
      {...props}
      style={[{fontFamily},style]}
      accessibilityRole={
        variant === "title" || variant === "heading"
          ? "header"
          : props.accessibilityRole
      }
      className={styles({ variant, className })}
    />
  );
}
