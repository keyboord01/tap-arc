import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Props = ComponentProps<"a"> & { variant: "primary" | "ghost"; size?: "md" | "lg" };

/** The landing page's two button styles, as links. */
export function LinkButton({ variant, size = "md", className, ...props }: Props) {
  return (
    <a
      className={cn(
        "flex items-center rounded-[14px] font-semibold no-underline",
        size === "md" ? "h-[54px] text-[17px]" : "h-[58px] text-[18px]",
        variant === "primary"
          ? cn(
              "bg-brand text-white transition-[background-color,transform] duration-200 ease-in-out hover:-translate-y-px hover:bg-brand-hover hover:text-white",
              size === "md" ? "px-[28px]" : "px-[30px]",
            )
          : cn(
              "border-[1.5px] border-line text-paper transition-[border-color,background-color] duration-200 ease-in-out hover:border-mint hover:bg-mint/8 hover:text-paper",
              size === "md" ? "px-[26px]" : "px-[28px]",
            ),
        className,
      )}
      {...props}
    />
  );
}
