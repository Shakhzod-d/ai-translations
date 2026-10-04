import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/shared/api';
import { QueryErrorState } from './states';

describe('QueryErrorState', () => {
  it('shows a friendly message, never the raw error, and allows retry', async () => {
    const onRetry = vi.fn();
    render(
      <QueryErrorState
        error={new ApiError('SERVER', { cause: 'TypeError: model overloaded at /v1/...' })}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Our servers had a problem');
    expect(screen.queryByText(/overloaded/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('treats unknown errors safely', () => {
    render(<QueryErrorState error={new Error('boom')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
  });
});
