import { RotateCcw } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES } from '@/shared/config';
import { Button, Label, SegmentedControl, Select } from '@/shared/ui';
import {
  CONTENT_WIDTHS,
  FONT_FAMILIES,
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  toReaderStyle,
  useReaderPreferences,
} from '../model/reader-preferences-store';

const RangeField = ({
  label,
  value,
  display,
  onChange,
  range,
}: {
  label: string;
  value: number;
  display: string;
  onChange: (v: number) => void;
  range: { min: number; max: number; step: number };
}) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <output htmlFor={id} className="text-muted-foreground text-sm tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        {...range}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary w-full"
      />
    </div>
  );
};

export const ReaderPreferencesForm = ({ showPreview = true }: { showPreview?: boolean }) => {
  const { t } = useTranslation();
  const prefs = useReaderPreferences(useShallow((s) => s));
  const translationId = useId();

  return (
    <div className="flex flex-col gap-6">
      <RangeField
        label={t('settings.fontSize')}
        value={prefs.fontSize}
        display={`${prefs.fontSize}px`}
        range={FONT_SIZE_RANGE}
        onChange={(fontSize) => prefs.update({ fontSize })}
      />
      <RangeField
        label={t('settings.lineHeight')}
        value={prefs.lineHeight}
        display={prefs.lineHeight.toFixed(1)}
        range={LINE_HEIGHT_RANGE}
        onChange={(lineHeight) => prefs.update({ lineHeight })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('settings.contentWidth')}</span>
        <SegmentedControl
          label={t('settings.contentWidth')}
          value={prefs.contentWidth}
          onValueChange={(contentWidth) => prefs.update({ contentWidth })}
          options={CONTENT_WIDTHS.map((w) => ({ value: w, label: t(`settings.widths.${w}`) }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('settings.fontFamily')}</span>
        <SegmentedControl
          label={t('settings.fontFamily')}
          value={prefs.fontFamily}
          onValueChange={(fontFamily) => prefs.update({ fontFamily })}
          options={FONT_FAMILIES.map((f) => ({ value: f, label: t(`settings.fonts.${f}`) }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={translationId}>{t('settings.translationLanguage')}</Label>
        <Select
          id={translationId}
          value={prefs.translationLanguage}
          onValueChange={(translationLanguage) => prefs.update({ translationLanguage })}
          options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NATIVE_NAMES[l] }))}
        />
      </div>
      {showPreview && (
        <p
          className="reader-prose border-border bg-background rounded-lg border p-4"
          style={toReaderStyle(prefs)}
        >
          {t('settings.preview')}
        </p>
      )}
      <Button variant="outline" className="self-start" onClick={prefs.reset}>
        <RotateCcw aria-hidden /> {t('settings.reset')}
      </Button>
    </div>
  );
};
