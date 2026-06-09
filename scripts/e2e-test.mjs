#!/usr/bin/env node

import fs from "node:fs";

let pairingCode = null;

const origLog = console.log;
console.log = (...args) => {
  const msg = args.join(" ");
  origLog(...args);
  
  const m = msg.match(/YOUR PAIRING CODE:.*?\[0m([A-Z0-9-]+)/);
  if (m) {
    pairingCode = m[1];
    process.stdout.write(JSON.stringify({ event: "pairing_code", code: pairingCode }) + "\n");
  }

  if (msg.includes("Pairing link complete")) {
    process.stdout.write(JSON.stringify({ event: "login_complete" }) + "\n");
  }
  
  if (msg.includes("An error occurred")) {
    process.stdout.write(JSON.stringify({ event: "error", message: msg }) + "\n");
  }
};

process.stdout.write(JSON.stringify({ event: "starting" }) + "\n");

import("../dist/core/login.js")
  .then((m) => m.loginCommand())
  .then(() => process.stdout.write(JSON.stringify({ event: "done" }) + "\n"))
  .catch((err) => {
    process.stdout.write(JSON.stringify({ event: "crash", error: err.message }) + "\n");
    process.exit(1);
  });
