#!/usr/bin/env node
import "dotenv/config";
import { startAgent } from "./core/agentLoop.js";
import { runSetup } from "./config/setup.js";
const command = process.argv[2];
if (command === "setup") {
    await runSetup();
}
else {
    await startAgent();
}
