#!/usr/bin/env node

import "dotenv/config";


import { startAgent } from "./core/agentLoop.js";
import { runSetup } from "./config/setup.js";
import {
  printCliHelp,
  printCliVersion,
  runDoctor,
} from "./core/cliCommands.js";

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
