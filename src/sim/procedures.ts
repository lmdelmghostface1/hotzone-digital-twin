/**
 * Procedure tracking (Phase 5).
 *
 * The register (src/data/procedures.json) contains ONLY documented steps in
 * documented order. A step can be completed only when it is the first
 * incomplete one (source order preserved); completing a later step is blocked
 * with an inline reason (hotzone-rules: a button either changes state or
 * explains why it is blocked).
 *
 * Steps flagged `manual` are physical actions outside the simulator (LOTO
 * locks, refractometer sampling, coil handling...). Completing them is a
 * SELF-CERTIFIED training action - the simulator neither performs nor
 * verifies them, and the UI must say so.
 *
 * No persistence and no scoring yet: assessment/progress arrives with
 * learning mode (Phase 6).
 */
import proceduresJson from '../data/procedures.json';
import type { ProcedureDef, ProceduresFile, ProcedureStepDef } from '../types/data';

export const procedures = (proceduresJson as unknown as ProceduresFile).procedures;
export const proceduresMeta = (proceduresJson as unknown as ProceduresFile).meta;

export function procedureById(id: string): ProcedureDef | null {
  return procedures.find((p) => p.id === id) ?? null;
}

/** training-metrics counters (Phase 6 learning mode): counts trainee
 *  ACTIONS this session - not pass/fail scores (criteria not documented;
 *  NV-024). They survive procedure resets on purpose. */
export interface ProcedureStats {
  completedSteps: number;
  selfCertifiedSteps: number;
  blockedAttempts: number;
  proceduresStarted: number;
  proceduresFinished: number;
}

export interface ProcState {
  /** step ids completed in document order */
  done: Set<string>;
  /** manual steps self-certified by the trainee (informational) */
  selfCertified: Set<string>;
  started: boolean;
}

export class ProcedureTracker {
  private state = new Map<string, ProcState>();
  private stats: ProcedureStats = {
    completedSteps: 0,
    selfCertifiedSteps: 0,
    blockedAttempts: 0,
    proceduresStarted: 0,
    proceduresFinished: 0
  };
  private finished = new Set<string>();

  sessionStats(): ProcedureStats {
    return { ...this.stats };
  }

  stateOf(procId: string): ProcState {
    let s = this.state.get(procId);
    if (!s) {
      s = { done: new Set(), selfCertified: new Set(), started: false };
      this.state.set(procId, s);
    }
    return s;
  }

  /** first incomplete step, or null when every step is done */
  currentStep(procId: string): ProcedureStepDef | null {
    const proc = procedureById(procId);
    if (!proc) return null;
    const s = this.stateOf(procId);
    return proc.steps.find((st) => !s.done.has(st.id)) ?? null;
  }

  progress(procId: string): { done: number; total: number } {
    const proc = procedureById(procId);
    const s = this.stateOf(procId);
    if (!proc) return { done: 0, total: 0 };
    return { done: s.done.size, total: proc.steps.length };
  }

  /** attempt to complete a step; returns an explanatory message either way,
   *  `ok` false means the action was blocked (state unchanged) */
  completeStep(procId: string, stepId: string): { ok: boolean; message: string } {
    const proc = procedureById(procId);
    if (!proc) return { ok: false, message: `unknown procedure ${procId}` };
    const step = proc.steps.find((x) => x.id === stepId);
    if (!step) return { ok: false, message: `unknown step ${stepId}` };
    const cur = this.currentStep(procId);
    if (cur && cur.id !== stepId) {
      this.stats.blockedAttempts++;
      return {
        ok: false,
        message: `blocked: the documented order next requires "${cur.id}" (source order preserved, no skipping)`
      };
    }
    if (!cur) {
      this.stats.blockedAttempts++;
      return { ok: false, message: 'blocked: every step is already completed' };
    }
    const s = this.stateOf(procId);
    s.done.add(stepId);
    if (!s.started) {
      s.started = true;
      this.stats.proceduresStarted++;
    }
    this.stats.completedSteps++;
    if (step.manual) {
      s.selfCertified.add(stepId);
      this.stats.selfCertifiedSteps++;
    }
    if (s.done.size === proc.steps.length && !this.finished.has(procId)) {
      this.finished.add(procId);
      this.stats.proceduresFinished++;
    }
    return {
      ok: true,
      message: step.manual
        ? `completed (self-certified): "${step.id}" is a physical action the simulator cannot verify`
        : `completed: ${step.id}`
    };
  }

  reset(procId?: string): void {
    if (procId) this.state.delete(procId);
    else this.state.clear();
  }
}

/** long-lived session tracker (Phase 6): the drawer and learning mode share
 *  these metrics; tests may still instantiate their own trackers */
export const procedureSession: ProcedureTracker = new ProcedureTracker();
