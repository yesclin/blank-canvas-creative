import { Button, ButtonProps } from "@/components/ui/button";
import { usePermissions, AppModule, AppAction } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { forwardRef } from "react";

interface PermissionButtonProps extends ButtonProps {
  module: AppModule;
  action: AppAction;
  tooltipText?: string;
}

/**
 * Button that's disabled when user lacks permission
 */
export const PermissionButton = forwardRef<HTMLButtonElement, PermissionButtonProps>(
  ({ module, action, tooltipText, disabled, children, ...props }, ref) => {
    const { can } = usePermissions();
    const hasPermission = can(module, action);
    const isDisabled = disabled || !hasPermission;

    const button = (
      <Button ref={ref} disabled={isDisabled} {...props}>
        {children}
      </Button>
    );

    if (!hasPermission && tooltipText) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText || "Você não tem permissão para esta ação"}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);

PermissionButton.displayName = "PermissionButton";
