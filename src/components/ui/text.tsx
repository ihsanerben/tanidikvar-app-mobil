import { Text as NativeText, type TextProps } from "react-native";
import { fontFamily } from "@/lib/theme";
import { cva } from "class-variance-authority";
const styles = cva("", {
  variants: {
    variant: {
      unstyled: "",
      body: "text-body text-text",
      title: "text-page-title font-bold text-primary",
      heading: "text-card-title font-bold text-primary",
      muted: "text-caption text-muted",
      label: "text-body font-semibold text-text",
    },
  },
  defaultVariants: { variant: "body" },
});
export function Text({
  variant = "body",
  className,
  style,
  ...props
}: TextProps & { variant?: "unstyled" | "body" | "title" | "heading" | "muted" | "label" }) {
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
