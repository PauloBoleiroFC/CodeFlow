"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "success";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  danger: "btn-danger",
  ghost: "btn-ghost",
  success: "btn-success",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  icon: "btn-icon",
};

/** Shared class builder for `<Button>` and button-styled links. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  loading = false,
  className,
}: ButtonClassNameOptions = {}) {
  return [
    "btn",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    loading ? "btn-loading" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
};

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const showIcons = size !== "icon";

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, loading, className })}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <LoaderCircle className="btn-spinner" aria-hidden size={16} />
        ) : showIcons && leftIcon ? (
          <span className="btn-icon-slot" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        {size === "icon" && !loading ? children : null}
        {size !== "icon" ? <span className="btn-label">{children}</span> : null}
        {!loading && showIcons && rightIcon ? (
          <span className="btn-icon-slot" aria-hidden>
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  },
);

export type ButtonLinkProps = CommonProps &
  Omit<LinkProps, "className"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    className?: string;
  };

export function ButtonLink({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const showIcons = size !== "icon";

  return (
    <Link
      className={buttonClassName({ variant, size, loading, className })}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <LoaderCircle className="btn-spinner" aria-hidden size={16} />
      ) : showIcons && leftIcon ? (
        <span className="btn-icon-slot" aria-hidden>
          {leftIcon}
        </span>
      ) : null}
      {size === "icon" && !loading ? children : null}
      {size !== "icon" ? <span className="btn-label">{children}</span> : null}
      {!loading && showIcons && rightIcon ? (
        <span className="btn-icon-slot" aria-hidden>
          {rightIcon}
        </span>
      ) : null}
    </Link>
  );
}
