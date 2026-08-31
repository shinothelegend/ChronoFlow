import { EventEmitter } from "node:events";
import type { AgentEvent, AgentPhase } from "../state/types.js";

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

class AgentEventBus extends EventEmitter {
  private currentPhase: AgentPhase = "idle";
  private recent: AgentEvent[] = [];

  emitAgentEvent(partial: DistributiveOmit<AgentEvent, "timestamp" | "previousPhase">) {
    const event = { ...partial, timestamp: Date.now(), previousPhase: this.currentPhase } as AgentEvent;
    this.currentPhase = event.phase;
    this.recent.push(event);
    if (this.recent.length > 100) this.recent.shift();
    this.emit("agent-event", event);
  }

  /** Lets a freshly-connected client catch up instead of rendering a blank state. */
  getSnapshot() {
    return { phase: this.currentPhase, recent: this.recent.slice(-20) };
  }
}

export const agentBus = new AgentEventBus();

// Guaranteed heartbeat — see Skill 3. Idle animations always have fresh data.
setInterval(() => {
  agentBus.emitAgentEvent({ type: "heartbeat", phase: agentBus.getSnapshot().phase });
}, 4000);
