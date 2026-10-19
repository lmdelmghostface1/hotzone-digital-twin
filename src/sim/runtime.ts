/**
 * Single shared simulation runtime.
 *
 * The 3D scene (src/three), the HMI model (src/hmi/hmiSim) and every Phase 4
 * control screen read and write ONLY through this one bus (hotzone-rules
 * section 4: one typed signal bus is the single source of truth; nothing
 * animates from a hidden variable).
 *
 * HONESTY: these are SIMULATED signals. They are not connected to any real PLC,
 * OPC UA, Modbus or factory network. See NV-022.
 */
import { SignalBus } from './bus';
import { LineSim } from './lineSim';
import { HmiSim } from '../hmi/hmiSim';

export const bus = new SignalBus();
export const sim = new LineSim(bus);
export const hmi = new HmiSim(bus);
