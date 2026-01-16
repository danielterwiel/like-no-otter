import * as React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";
import { TextClassContext } from "@/components/ui/text";

interface CardProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const Card = React.forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ className, ...props }, ref) => (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm shadow-foreground/5",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  ),
);
Card.displayName = "Card";

interface CardHeaderProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const CardHeader = React.forwardRef<React.ElementRef<typeof View>, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const CardTitle = React.forwardRef<React.ElementRef<typeof View>, CardTitleProps>(
  ({ className, ...props }, ref) => <View ref={ref} className={cn("", className)} {...props} />,
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const CardDescription = React.forwardRef<React.ElementRef<typeof View>, CardDescriptionProps>(
  ({ className, ...props }, ref) => <View ref={ref} className={cn("", className)} {...props} />,
);
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const CardContent = React.forwardRef<React.ElementRef<typeof View>, CardContentProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
}

const CardFooter = React.forwardRef<React.ElementRef<typeof View>, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex flex-row items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
