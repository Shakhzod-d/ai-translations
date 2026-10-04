import { FileText } from 'lucide-react';
import type { FileType } from '@/shared/api';
import { Badge } from '@/shared/ui';
import { FILE_TYPE_RULES } from '../model/file-rules';

export const FileTypeBadge = ({ type }: { type: FileType }) => (
  <Badge variant="outline">
    <FileText aria-hidden />
    {FILE_TYPE_RULES[type].label}
  </Badge>
);
