import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { ArticleSummary } from '@/entities/article';
import { cn } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldError,
  IconButton,
  Input,
  Label,
} from '@/shared/ui';
import { useDeleteDocument, useUpdateDocument } from '../model/mutations';

export const ToggleFavoriteButton = ({ document }: { document: ArticleSummary }) => {
  const { t } = useTranslation();
  const update = useUpdateDocument();
  const { favorite } = document.metadata;
  return (
    <IconButton
      size="icon-sm"
      aria-pressed={favorite}
      label={favorite ? t('documents.unfavorite') : t('documents.favorite')}
      icon={<Star aria-hidden className={cn(favorite && 'fill-warning text-warning')} />}
      onClick={() => update.mutate({ id: document.id, patch: { favorite: !favorite } })}
    />
  );
};

const renameSchema = z.object({
  title: z.string().trim().min(1, 'documents.titleRequired').max(200, 'documents.titleTooLong'),
});
type RenameValues = z.infer<typeof renameSchema>;

const RenameDialog = ({
  document,
  open,
  onOpenChange,
}: {
  document: ArticleSummary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const { t } = useTranslation();
  const update = useUpdateDocument();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    values: { title: document.title },
  });
  const errorKey = errors.title?.message as
    'documents.titleRequired' | 'documents.titleTooLong' | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('documents.renameTitle')} closeLabel={t('common.close')}>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(({ title }) =>
            update.mutate(
              { id: document.id, patch: { title } },
              { onSuccess: () => onOpenChange(false) },
            ),
          )}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-title">{t('documents.renameLabel')}</Label>
            <Input
              id="rename-title"
              autoFocus
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'rename-error' : undefined}
              {...register('title')}
            />
            <FieldError id="rename-error">{errorKey && t(errorKey)}</FieldError>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={update.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeleteDialog = ({
  document,
  open,
  onOpenChange,
}: {
  document: ArticleSummary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const { t } = useTranslation();
  const remove = useDeleteDocument();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t('documents.deleteTitle')}
        description={t('documents.deleteBody', { title: document.title })}
        closeLabel={t('common.close')}
        role="alertdialog"
      >
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            loading={remove.isPending}
            onClick={() => remove.mutate(document.id, { onSuccess: () => onOpenChange(false) })}
          >
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DocumentActionsMenu = ({ document }: { document: ArticleSummary }) => {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            size="icon-sm"
            label={`${t('common.more')}: ${document.title}`}
            icon={<MoreHorizontal aria-hidden />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setDialog('rename')}>
            <Pencil aria-hidden /> {t('common.rename')}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setDialog('delete')}>
            <Trash2 aria-hidden /> {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDialog
        document={document}
        open={dialog === 'rename'}
        onOpenChange={(o) => setDialog(o ? 'rename' : null)}
      />
      <DeleteDialog
        document={document}
        open={dialog === 'delete'}
        onOpenChange={(o) => setDialog(o ? 'delete' : null)}
      />
    </>
  );
};
