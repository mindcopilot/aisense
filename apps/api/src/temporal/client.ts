/**
 * Temporal client — starts workflows and schedules from the API process.
 *
 * Degrades gracefully: if Temporal is unreachable the caller is told so and
 * can fall back (inline rendering / in-process scheduling), keeping the app
 * usable without infra.
 */
import { Connection, Client, ScheduleOverlapPolicy } from "@temporalio/client";
import { config } from "../config.js";
import {
  photoshootWorkflow,
  marketingCampaignWorkflow,
  type PhotoshootInput,
} from "./workflows.js";

let clientPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const connection = await Connection.connect({
        address: config.temporal.address,
      });
      return new Client({ connection, namespace: config.temporal.namespace });
    })();
  }
  return clientPromise;
}

/**
 * Kick off a photoshoot batch. Returns the workflow id, or null if Temporal is
 * unavailable (the studio service then renders inline as a fallback).
 */
export async function startPhotoshoot(
  input: PhotoshootInput,
): Promise<string | null> {
  try {
    const client = await getClient();
    const workflowId = `photoshoot-${input.batchId}`;
    await client.workflow.start(photoshootWorkflow, {
      taskQueue: config.temporal.taskQueue,
      workflowId,
      args: [input],
    });
    return workflowId;
  } catch (err) {
    console.warn("[temporal] could not start workflow, falling back", err);
    return null;
  }
}

/**
 * Kick off one marketing campaign run. Returns the workflow id, or null if
 * Temporal is unavailable (the marketing service then runs the pipeline
 * inline).
 */
export async function startCampaign(input: {
  campaignId: string;
  brief: string;
}): Promise<string | null> {
  try {
    const client = await getClient();
    const workflowId = `campaign-${input.campaignId}`;
    await client.workflow.start(marketingCampaignWorkflow, {
      taskQueue: config.temporal.taskQueue,
      workflowId,
      args: [{ campaignId: input.campaignId, brief: input.brief }],
    });
    return workflowId;
  } catch (err) {
    console.warn("[temporal] could not start campaign, falling back", err);
    return null;
  }
}

/**
 * Create a Temporal Schedule that runs the campaign pipeline every
 * `intervalMinutes`. Returns true on success; false if Temporal is
 * unavailable, in which case the caller uses an in-process timer instead.
 */
export async function createCampaignSchedule(input: {
  scheduleId: string;
  brief: string;
  intervalMinutes: number;
}): Promise<boolean> {
  try {
    const client = await getClient();
    await client.schedule.create({
      scheduleId: input.scheduleId,
      spec: { intervals: [{ every: `${input.intervalMinutes}m` }] },
      // Skip a run if the previous one is still going.
      policies: { overlap: ScheduleOverlapPolicy.SKIP },
      action: {
        type: "startWorkflow",
        workflowType: marketingCampaignWorkflow,
        taskQueue: config.temporal.taskQueue,
        args: [{ brief: input.brief, scheduleId: input.scheduleId }],
      },
    });
    return true;
  } catch (err) {
    console.warn("[temporal] could not create schedule, using in-process timer", err);
    return false;
  }
}

/** Delete a Temporal Schedule. Best-effort. */
export async function deleteCampaignSchedule(scheduleId: string): Promise<void> {
  try {
    const client = await getClient();
    await client.schedule.getHandle(scheduleId).delete();
  } catch (err) {
    console.warn("[temporal] could not delete schedule", err);
  }
}
