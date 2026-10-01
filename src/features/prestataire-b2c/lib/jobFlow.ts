import { createContext, useContext } from 'react';
import type { JobAction, JobState } from './jobs';

/**
 * What every B2C card and sheet can do with a job: open its detail, or press
 * one of its buttons — the provider asks for confirmation, opens the
 * modification sheet, or sends (see `JobFlowProvider`).
 */
export interface JobFlow {
  openDetail: (id: string) => void;
  press: (id: string, state: JobState, action: JobAction) => void;
  isBusy: (id: string, action?: JobAction) => boolean;
}

export const JobFlowContext = createContext<JobFlow | null>(null);

export function useJobFlow(): JobFlow {
  const flow = useContext(JobFlowContext);
  if (!flow) throw new Error('useJobFlow outside JobFlowProvider');
  return flow;
}
