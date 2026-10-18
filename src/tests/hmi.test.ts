import { describe, it, expect } from 'vitest';
import { HmiSim, FAULT_ALARMS } from '../hmi/hmiSim';
import { LineSim } from '../sim/lineSim';
import { SignalBus } from '../sim/bus';
import hmiErrors from '../data/hmi-errors.json';

const entries = hmiErrors.entries as unknown as { id: string; text: string; code: string }[];

describe('hmi: register', () => {
  it('loads the whole extracted alarm register', () => {
    const hmi = new HmiSim();
    expect(hmi.alarms.length).toBe(entries.length);
    expect(hmi.alarms.length).toBeGreaterThanOrEqual(70);
  });

  it('maps every fault to a real register code (nothing invented)', () => {
    const ids = new Set(entries.map((e) => e.id));
    for (const alarmId of Object.values(FAULT_ALARMS)) {
      expect(ids.has(alarmId), `${alarmId} exists in the register`).toBe(true);
    }
  });

  it('shows the alarm text taken from the register, not invented', () => {
    const hmi = new HmiSim();
    for (const a of hmi.alarms) {
      const src = entries.find((e) => e.id === a.id)!;
      expect(a.text).toBe(src.text);
      expect(a.code).toBe(src.code);
    }
  });

  it('opens with no active alarms and a NORMAL banner', () => {
    const hmi = new HmiSim();
    expect(hmi.activeAlarms().length).toBe(0);
    expect(hmi.signals().severity).toBe('NORMAL');
  });
});

describe('hmi: fault -> alarm lifecycle', () => {
  it('raises the mapped alarm as active-unacked when a fault is toggled on', () => {
    const hmi = new HmiSim();
    hmi.toggle('laserDisabled');
    hmi.tick(0.1);
    const a = hmi.alarms.find((x) => x.id === FAULT_ALARMS.laserDisabled)!;
    expect(a.state).toBe('active-unacked');
    expect(hmi.signals().severity).toBe('ALARM');
    expect(hmi.signals().hasUnacked).toBe(true);
  });

  it('acknowledges, then clears, then auto-clears the fault', () => {
    const hmi = new HmiSim();
    hmi.toggle('conveyorStop');
    hmi.tick(0);
    const id = FAULT_ALARMS.conveyorStop;
    expect(hmi.alarms.find((a) => a.id === id)!.state).toBe('active-unacked');
    hmi.ack(id);
    expect(hmi.alarms.find((a) => a.id === id)!.state).toBe('active-acked');
    expect(hmi.signals().severity).toBe('ACTIVE');
    hmi.clear(id);
    expect(hmi.alarms.find((a) => a.id === id)!.state).toBe('cleared');
    expect(hmi.faults.conveyorStop).toBe(false);
    expect(hmi.signals().severity).toBe('NORMAL');
  });

  it('raises each of the six faults to its own register code', () => {
    const hmi = new HmiSim();
    const keys = Object.keys(FAULT_ALARMS) as (keyof typeof hmi.faults)[];
    for (const k of keys) hmi.toggle(k);
    hmi.tick(0);
    expect(hmi.activeAlarms().length).toBe(keys.length);
    for (const k of keys) {
      const a = hmi.alarms.find((x) => x.id === FAULT_ALARMS[k]);
      expect(a?.state, `${k} -> ${FAULT_ALARMS[k]}`).toBe('active-unacked');
    }
    hmi.ackAll();
    expect(hmi.signals().severity).toBe('ACTIVE');
    hmi.clearAll();
    expect(hmi.activeAlarms().length).toBe(0);
  });
});

describe('hmi: fault -> line sim link (through the signal bus)', () => {
  const make = () => {
    const bus = new SignalBus();
    return { bus, sim: new LineSim(bus), hmi: new HmiSim(bus) };
  };

  it('forces the laser off and a gage offset on the bus', () => {
    const { bus, sim, hmi } = make();
    sim.reset();
    hmi.toggle('laserDisabled');
    hmi.toggle('gageForceNok');
    hmi.tick(0);
    expect(bus.asBool('laser.enabled')).toBe(false);
    expect(bus.asNumber('gage.offsetMm')).toBeGreaterThan(0);
    expect(bus.isForced('laser.enabled')).toBe(true);
    expect(bus.isForced('gage.offsetMm')).toBe(true);
  });

  it('stops the line through the conveyor signal and resumes when cleared', () => {
    const { bus, sim, hmi } = make();
    sim.reset();
    hmi.toggle('conveyorStop');
    hmi.tick(0);
    expect(bus.asBool('conv.stop')).toBe(true);
    const t0 = sim.t;
    for (let i = 0; i < 20; i++) sim.tick(0.1);
    expect(sim.t).toBe(t0);
    hmi.clear(FAULT_ALARMS.conveyorStop);
    hmi.tick(0);
    expect(bus.asBool('conv.stop')).toBe(false);
    sim.tick(0.1);
    expect(sim.t).toBeGreaterThan(t0);
  });

  it('writes forced signals to the audit log', () => {
    const { bus, hmi } = make();
    hmi.toggle('damagedCode');
    hmi.tick(0);
    const log = bus.history();
    expect(log.some((r) => r.key === 'fault.damagedCode' && r.forced)).toBe(true);
  });

  it('reset returns the HMI to a clean, normal state and un-forces every signal', () => {
    const { bus, hmi } = make();
    hmi.toggle('heatFault');
    hmi.tick(0);
    hmi.reset();
    hmi.tick(0);
    expect(hmi.activeAlarms().length).toBe(0);
    expect(hmi.signals().severity).toBe('NORMAL');
    expect(hmi.alarms.length).toBe(entries.length);
    expect(bus.forcedKeysList().length).toBe(0);
  });
});


