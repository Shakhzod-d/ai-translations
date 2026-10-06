import { useMemo, useReducer } from 'react';
import {
  emptyAnswers,
  gradeExerciseSet,
  type ExerciseAnswers,
  type ExerciseSet,
} from '@/entities/exercise';

interface AttemptState {
  answers: ExerciseAnswers;
  checked: boolean;
}

type Action =
  | { type: 'answer'; kind: 'choice'; id: string; value: number }
  | { type: 'answer'; kind: 'gap' | 'match' | 'open'; id: string; value: string }
  | { type: 'check' }
  | { type: 'reset' };

const initial = (): AttemptState => ({ answers: emptyAnswers(), checked: false });

const reducer = (state: AttemptState, action: Action): AttemptState => {
  switch (action.type) {
    case 'answer':
      // Answers are frozen once checked, until the learner starts again.
      if (state.checked) return state;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.kind]: { ...state.answers[action.kind], [action.id]: action.value },
        },
      };
    case 'check':
      return { ...state, checked: true };
    case 'reset':
      return initial();
  }
};

/** One attempt at an exercise set. Remount (key by set id) to start fresh for a new set. */
export const useExerciseAttempt = (set: ExerciseSet) => {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const grade = useMemo(
    () => (state.checked ? gradeExerciseSet(set, state.answers) : null),
    [set, state],
  );
  return {
    answers: state.answers,
    checked: state.checked,
    grade,
    setChoice: (id: string, value: number) =>
      dispatch({ type: 'answer', kind: 'choice', id, value }),
    setText: (kind: 'gap' | 'match' | 'open', id: string, value: string) =>
      dispatch({ type: 'answer', kind, id, value }),
    check: () => dispatch({ type: 'check' }),
    reset: () => dispatch({ type: 'reset' }),
  };
};

export type ExerciseAttempt = ReturnType<typeof useExerciseAttempt>;
