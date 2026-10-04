import { AlertTriangle, RotateCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { toApiError } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button, buttonVariants } from './button';

interface StateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: StateProps) => (
  <div
    className={cn(
      'border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center',
      className,
    )}
  >
    {icon && (
      <div className="bg-muted text-muted-foreground rounded-full p-3 [&_svg]:size-6" aria-hidden>
        {icon}
      </div>
    )}
    <h2 className="text-base font-semibold">{title}</h2>
    {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const ErrorState = ({
  title,
  description,
  action,
  className,
  onRetry,
}: Omit<StateProps, 'icon'> & { onRetry?: () => void }) => {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        'border-error/30 bg-error/5 flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="text-error size-6" aria-hidden />
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      <div className="mt-1 flex gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw aria-hidden /> {t('common.retry')}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
};

/** Maps any query/mutation error to a friendly, localized message. Raw errors never reach the UI. */
export const QueryErrorState = ({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const apiError = toApiError(error);
  const needsSettings = apiError.code === 'AI_NOT_CONFIGURED' || apiError.code === 'UNAUTHORIZED';
  return (
    <ErrorState
      className={className}
      title={t('errors.title')}
      description={t(`errors.${apiError.code}`)}
      onRetry={apiError.code === 'NOT_FOUND' || needsSettings ? undefined : onRetry}
      action={
        needsSettings ? (
          <Link to={ROUTES.settings} className={buttonVariants({ variant: 'outline' })}>
            {t('ai.openSettings')}
          </Link>
        ) : undefined
      }
    />
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (reset: () => void) => ReactNode;
  onError?: (error: unknown, info: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    // Errors are reported, never swallowed. Wire a monitoring service here.
    console.error(error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false });

  override render() {
    return this.state.hasError ? this.props.fallback(this.reset) : this.props.children;
  }
}
