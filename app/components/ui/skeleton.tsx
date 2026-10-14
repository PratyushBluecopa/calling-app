import { cn } from "~/utils/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("copa:bg-accent copa:animate-pulse copa:rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
