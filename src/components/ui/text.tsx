import { Text as NativeText, type TextProps } from "react-native";
import { cva } from "class-variance-authority";
const styles = cva("text-text", {
  variants: {
    variant: {
      body: "text-base leading-6",
      title: "text-3xl font-bold",
      heading: "text-xl font-bold",
      muted: "text-sm leading-5 text-muted",
      label: "text-base font-semibold",
    },
  },
  defaultVariants: { variant: "body" },
});
export function Text({
  variant = "body",
  className,
  ...props
}: TextProps & { variant?: "body" | "title" | "heading" | "muted" | "label" }) {
  return (
    <NativeText
      {...props}
      accessibilityRole={
        variant === "title" || variant === "heading"
          ? "header"
          : props.accessibilityRole
      }
      className={styles({ variant, className })}
    />
  );
}
