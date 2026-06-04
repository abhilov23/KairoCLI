import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { readFile } from "../tools/readFile.js";
import { listDirectory } from "../tools/listDirectory.js";

const TEST_DIR = path.join(os.tmpdir(), "kairo-tools-test-" + Date.now());
const TEST_FILE = path.join(TEST_DIR, "test.txt");

describe("Tools", () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.writeFile(TEST_FILE, "Hello, World!", "utf-8");
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("read_file should return file content", async () => {
    const result = await readFile.execute({ path: TEST_FILE });
    expect(result).toBe("Hello, World!");
  });

  it("read_file should return error for missing file", async () => {
    const result = await readFile.execute({ path: path.join(TEST_DIR, "nonexistent.txt") });
    expect(result).toContain("Failed to read file");
  });

  it("list_directory should return files in directory", async () => {
    const result = await listDirectory.execute({ directory: TEST_DIR });
    expect(result).toContain("test.txt");
  });

  it("list_directory should work without directory parameter", async () => {
    const result = await listDirectory.execute({});
    expect(typeof result).toBe("string");
  });

  it("get_time should return a valid date string", async () => {
    const { getTime } = await import("../tools/getTime.js");
    const result = await getTime.execute({});
    expect(() => new Date(result as string)).not.toThrow();
    expect(new Date(result as string).toISOString()).toBeTruthy();
  });
});
