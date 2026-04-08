import * as React from "react";

import { cn } from "@/lib/utils";

type FieldErrorItem = {
    message?: string;
};

export function Field({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("space-y-1", className)} {...props} />;
}

export function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("space-y-1", className)} {...props} />;
}

export function FieldError({
    errors,
    className,
}: {
    errors: Array<FieldErrorItem | false | null | undefined>;
    className?: string;
}) {
    const item = errors.find(
        (value): value is FieldErrorItem =>
            typeof value === "object" &&
            value !== null &&
            typeof value.message === "string" &&
            value.message.length > 0
    );

    if (!item?.message) {
        return null;
    }

    return <p className={cn("text-sm text-destructive", className)}>{item.message}</p>;
}
