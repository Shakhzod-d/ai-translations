import { PROCESSING_STAGES, type ProcessingStage } from '@/shared/api';

/** Stages of a plain file upload; exercises are only created for pasted texts. */
export const UPLOAD_STAGES = PROCESSING_STAGES.filter((s) => s !== 'exercises');

export const stagesForImport = (withExercises: boolean): readonly ProcessingStage[] =>
  withExercises ? PROCESSING_STAGES : UPLOAD_STAGES;
