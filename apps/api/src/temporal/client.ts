/**
 * Temporal client — starts photoshoot workflows from the API process.
 *
 * Degrades gracefully: if Temporal is unreachable the caller is told so and
 * can fall back to inline rendering, keeping the app usable without infra.
 */
import { Connection, Client } from "@temporalio/client";
import { config } from "../config.js";
import { photoshootWorkflow, type PhotoshootInput } from "./workflows.js";

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
