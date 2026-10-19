/**
 * Learning mode (Phase 6) - training session metrics.
 *
 * HONESTY (hotzone-rules / faults + procedures registers):
 *  - this module reports INFORMATIONAL counters derived from what the
 *    trainee actually did (steps completed by hand, drill runs, hints,
 *    abandoned drills). It invents NO pass/fail thresholds and no letter
 *    grades: the evaluation criteria for the real line are not in the
 *    controlled sources (needs-verification NV-024).
 *  - drill "signal writes" counts every write of a trigger signal while a
 *    drill ran (bus per-key counters) - it is diagnostic, not a score.
 *  - everything is training data on the SIMULATED line, never the plant.
 */
import { drills } from './faults';
import { procedureSession, procedures } from './procedures';
import { bus, hmi } from './runtime';

export interface DrillSessionStats {
  total: number;
  recovered: number;
  selfCertified: number;
  abandoned: number;
  hintsUsed: number;
  avgElapsedSimS: number;
  faultsTouched: string[];
}

export interface LearningSummary {
  /** wall-clock mm:ss since first summary request of the session */
  sessionLength: string;
  procedures: { completedSteps: number; selfCertifiedSteps: number; blockedAttempts: number; started: number; finished: number; total: number };
  drills: DrillSessionStats;
  sim: { forcedSignals: string[]; activeAlarms: string[]; drillRunning: string | null };
}

class LearningImpl {
  private startedAt: number | null = null;

  summary(): LearningSummary {
    if (this.startedAt === null) this.startedAt = Date.now();
    const length = Date.now() - this.startedAt;
    const mm = Math.floor(length / 60000);
    const ss = Math.floor((length % 60000) / 1000);

    const hist = drills.history();
    const recovered: DrillSessionStats = { total: hist.length, recovered: 0, selfCertified: 0, abandoned: 0, hintsUsed: 0, avgElapsedSimS: 0, faultsTouched: [] };
    let elapsedSum = 0;
    let elapsedN = 0;
    for (const r of hist) {
      if (!recovered.faultsTouched.includes(r.faultId)) recovered.faultsTouched.push(r.faultId);
      recovered.hintsUsed += r.hintsUsed;
      if (r.selfCertified) recovered.selfCertified++;
      else if (r.abandoned) recovered.abandoned++;
      else if (r.state === 'recovered') {
        recovered.recovered++;
        elapsedSum += r.recoveredAt - r.injectedAt;
        elapsedN++;
      }
    }
    if (elapsedN > 0) recovered.avgElapsedSimS = elapsedSum / elapsedN;

    const st = procedureSession.sessionStats();
    const running = drills.active();
    return {
      sessionLength: `${mm}:${ss < 10 ? '0' : ''}${ss}`,
      procedures: {
        completedSteps: st.completedSteps,
        selfCertifiedSteps: st.selfCertifiedSteps,
        blockedAttempts: st.blockedAttempts,
        started: st.proceduresStarted,
        finished: st.proceduresFinished,
        total: procedures.length
      },
      drills: recovered,
      sim: {
        forcedSignals: bus.forcedKeysList(),
        activeAlarms: hmi.activeAlarms().map((a) => a.id),
        drillRunning: running ? running.faultId : null
      }
    };
  }
}

export const learning = new LearningImpl();
