import { StateGraph, END, START } from "@langchain/langgraph";
import { ArbitrageState } from "../state/schema.js";
import { monitorNode } from "../nodes/monitor.node.js";
import { routerNode } from "../nodes/router.node.js";
import { riskNode } from "../nodes/risk.node.js";
import { executionNode } from "../nodes/execution.node.js";

export function buildGraph() {
  return new StateGraph(ArbitrageState)
    .addNode("monitor", monitorNode)
    .addNode("router", routerNode)
    .addNode("risk", riskNode)
    .addNode("execution", executionNode)
    .addEdge(START, "monitor")
    .addEdge("monitor", "router")
    .addEdge("router", "risk")
    .addConditionalEdges("risk", (state) => (state.executionStatus === "pending" ? "execution" : END))
    .addEdge("execution", END)
    .compile();
}
