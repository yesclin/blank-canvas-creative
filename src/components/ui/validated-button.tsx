import * as React from "react";
import { Button, ButtonProps } from "./button";
import { useButtonActionLogger } from "@/hooks/useSpecialtyValidation";

interface ValidatedButtonProps extends ButtonProps {
  /** 
   * Action handler - REQUIRED. Button will be disabled if not provided.
   * This ensures no button exists without a functional action.
   */
  onAction: (() => void) | (() => Promise<void>);
  /** Action type for audit logging */
  actionType?: string;
  /** Action target for audit logging */
  actionTarget?: string;
  /** Whether to log this action */
  logAction?: boolean;
}

/**
 * A button that enforces the rule: "No button without functional action"
 * 
 * Features:
 * - Requires onAction prop (won't render enabled without it)
 * - Optional audit logging
 * - Prevents double-clicks during async actions
 */
export function ValidatedButton({
  onAction,
  actionType,
  actionTarget,
  logAction = false,
  disabled,
  children,
  ...props
}: ValidatedButtonProps) {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const { logAction: logButtonAction } = useButtonActionLogger();

  // If no action provided, button should be disabled
  const hasAction = typeof onAction === 'function';
  const isDisabled = disabled || !hasAction || isExecuting;

  const handleClick = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!hasAction || isExecuting) return;

    setIsExecuting(true);
    try {
      // Log action if enabled
      if (logAction && actionType) {
        await logButtonAction(actionType, actionTarget || 'unknown');
      }

      // Execute the action
      await onAction();
    } finally {
      setIsExecuting(false);
    }
  }, [hasAction, isExecuting, logAction, actionType, actionTarget, logButtonAction, onAction]);

  // Development warning for buttons without actions
  React.useEffect(() => {
    if (!hasAction && process.env.NODE_ENV === 'development') {
      console.warn('ValidatedButton: onAction prop is required for all buttons');
    }
  }, [hasAction]);

  return (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

/**
 * HOC to validate that a button component has an action
 */
export function withActionValidation<P extends { onClick?: () => void }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithActionValidation(props: P) {
    const hasAction = typeof props.onClick === 'function';
    
    if (!hasAction && process.env.NODE_ENV === 'development') {
      console.warn('Button rendered without onClick handler');
    }

    return <WrappedComponent {...props} disabled={!hasAction || (props as any).disabled} />;
  };
}
