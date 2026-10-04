import type { CefrLevel } from '@/shared/config';
import { Badge } from '@/shared/ui';

export const LevelBadge = ({ level, className }: { level: CefrLevel; className?: string }) => (
  <Badge variant="primary" className={className}>
    {level}
  </Badge>
);
