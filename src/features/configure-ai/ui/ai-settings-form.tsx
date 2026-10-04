import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ExternalLink, Eye, EyeOff, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  AI_PROVIDER_INFO,
  AI_PROVIDERS,
  toApiError,
  useAiSettings,
  usesBuiltinAi,
  verifyApiKey,
  type AiProvider,
} from '@/shared/api';
import {
  Badge,
  Button,
  FieldError,
  IconButton,
  Input,
  Label,
  SegmentedControl,
  Select,
  toast,
} from '@/shared/ui';

type KeyValues = { apiKey: string };

const ProviderKeyForm = ({ provider }: { provider: AiProvider }) => {
  const { t } = useTranslation();
  const info = AI_PROVIDER_INFO[provider];
  const config = useAiSettings((s) => s.providers[provider]);
  const { setApiKey, setModel, clearKey } = useAiSettings();
  const [visible, setVisible] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({ apiKey: z.string().trim().min(1, t('ai.keyRequired')) }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KeyValues>({
    resolver: zodResolver(schema),
    values: { apiKey: config.apiKey },
  });

  const onSubmit = async ({ apiKey }: KeyValues) => {
    setVerifyError(null);
    try {
      await verifyApiKey(provider, apiKey, config.model);
      setApiKey(provider, apiKey);
      toast.success(t('ai.saved'));
    } catch (error) {
      setVerifyError(t(`errors.${toApiError(error).code}`));
    }
  };

  const fieldError = verifyError ?? errors.apiKey?.message;
  const inputId = `ai-key-${provider}`;
  const builtin = usesBuiltinAi(provider, config.apiKey);

  return (
    <div className="flex flex-col gap-5">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={inputId}>{t('ai.keyLabel', { provider: info.label })}</Label>
          {config.apiKey ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden /> {t('ai.connected')}
            </Badge>
          ) : builtin ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden /> {t('ai.builtin')}
            </Badge>
          ) : (
            <Badge>
              <XCircle aria-hidden /> {t('ai.notConnected')}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type={visible ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder={info.keyExample}
            aria-invalid={!!fieldError}
            aria-describedby={`${inputId}-hint ${inputId}-error`}
            className="font-mono"
            {...register('apiKey', { onChange: () => setVerifyError(null) })}
          />
          <IconButton
            variant="outline"
            label={visible ? t('ai.hide') : t('ai.show')}
            icon={visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            onClick={() => setVisible((v) => !v)}
          />
        </div>
        <FieldError id={`${inputId}-error`}>{fieldError}</FieldError>
        {builtin && <p className="text-muted-foreground text-sm">{t('ai.builtinHint')}</p>}
        <p id={`${inputId}-hint`} className="text-muted-foreground text-xs">
          {t('ai.keyHint', { host: info.host })}
        </p>
        <a
          href={info.keyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary inline-flex w-fit items-center gap-1 text-xs font-medium hover:underline"
        >
          {t('ai.getKey', { site: info.keySite })} <ExternalLink className="size-3" aria-hidden />
        </a>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="submit" loading={isSubmitting}>
            {t('ai.save')}
          </Button>
          {config.apiKey && (
            <Button
              variant="outline"
              onClick={() => {
                clearKey(provider);
                reset({ apiKey: '' });
                toast.info(t('ai.removed'));
              }}
            >
              {t('ai.remove')}
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`ai-model-${provider}`}>{t('ai.model')}</Label>
        <Select
          id={`ai-model-${provider}`}
          value={config.model}
          onValueChange={(model) => setModel(provider, model)}
          options={info.models.map((m) => ({ value: m.id, label: m.label }))}
        />
      </div>
    </div>
  );
};

export const AiSettingsForm = () => {
  const { t } = useTranslation();
  const provider = useAiSettings((s) => s.provider);
  const setProvider = useAiSettings((s) => s.setProvider);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">{t('ai.description')}</p>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('ai.provider')}</span>
        <SegmentedControl
          label={t('ai.provider')}
          value={provider}
          onValueChange={setProvider}
          options={AI_PROVIDERS.map((p) => ({ value: p, label: AI_PROVIDER_INFO[p].label }))}
        />
      </div>
      {/* key: remount per provider so form state never leaks between providers */}
      <ProviderKeyForm key={provider} provider={provider} />
    </div>
  );
};
