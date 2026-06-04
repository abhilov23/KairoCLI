#!/usr/bin/env node

import "dotenv/config";

import { registerAllTools } from "./tools/index.js";
import { startAgent, runTask } from "./core/agentLoop.js";
import { runSetup } from "./config/setup.js";
import {
  printCliHelp,
  printCliVersion,
  runDoctor,
} from "./core/cliCommands.js";

// Register all tools at startup
registerAllTools();

// Detect --task flag
const taskIndex = process.argv.indexOf("--task");
if (taskIndex !== -1) {
  const task = process.argv[taskIndex + 1];
  if (!task) {
    console.error("--task requires a value");
    process.exit(1);
  }
  await runTask(task);
  process.exit(0);
}

const command = process.argv[2];

switch (command) {
  case "setup":
    await runSetup();
    break;
  case "doctor":
    await runDoctor();
    break;
  case "help":
  case "--help":
  case "-h":
    printCliHelp();
    break;
  case "version":
  case "--version":
  case "-v":
    printCliVersion();
    break;
  default:
    await startAgent();
    break;
}
