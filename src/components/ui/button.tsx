import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--spacingHorizontalS)] whitespace-nowrap text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] transition-all duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--colorBrandBackground)] text-[var(--colorBrandForeground1)] shadow-[var(--shadow2)] hover:bg-[var(--colorBrandBackgroundHover)] active:bg-[var(--colorBrandBackgroundPressed)] rounded-[var(--borderRadiusMedium)]",
        destructive:
          "bg-[var(--colorStatusDangerBackground3)] text-[var(--colorBrandForeground1)] shadow-[var(--shadow2)] hover:opacity-90 active:opacity-80 rounded-[var(--borderRadiusMedium)]",
        outline:
          "border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] text-[var(--colorNeutralForeground1)] hover:bg-[var(--colorNeutralBackground4)] active:bg-[var(--colorNeutralBackground5)] rounded-[var(--borderRadiusMedium)]",
        secondary:
          "bg-[var(--colorNeutralBackground4)] text-[var(--colorNeutralForeground1)] shadow-[var(--shadow2)] hover:bg-[var(--colorNeutralBackground5)] active:bg-[var(--colorNeutralBackground6)] rounded-[var(--borderRadiusMedium)]",
        ghost:
          "bg-transparent text-[var(--colorNeutralForeground2)] hover:bg-[var(--colorNeutralBackground4)] active:bg-[var(--colorNeutralBackground5)] rounded-[var(--borderRadiusMedium)]",
        link: "text-[var(--colorBrandForegroundLink)] underline-offset-4 hover:underline hover:text-[var(--colorBrandBackgroundHover)]",
      },
      size: {
        default:
          "h-8 px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalSNudge)] has-[>svg]:px-[var(--spacingHorizontalS)]",
        sm: "h-6 px-[var(--spacingHorizontalS)] py-[var(--spacingVerticalXXS)] text-[var(--fontSizeBase200)] gap-[var(--spacingHorizontalXS)] has-[>svg]:px-[var(--spacingHorizontalXS)]",
        lg: "h-10 px-[var(--spacingHorizontalL)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase400)] has-[>svg]:px-[var(--spacingHorizontalM)]",
        icon: "size-8 p-[var(--spacingHorizontalXS)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
