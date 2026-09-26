import type { ComponentPropsWithoutRef } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({ className = "", ...props }: ContainerProps) {
  return (
    <div className={`max-w-6xl mx-auto px-6 ${className}`} {...props} />
  );
}
