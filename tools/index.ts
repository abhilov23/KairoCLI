import { registry } from "./registry.js";
import { getTime } from "./getTime.js";
import { executeCommand } from "./execCommand.js";
import { currentDirectory } from "./currentDirectory.js";
import { listDirectory } from "./listDirectory.js";
import { readFile } from "./readFile.js";
import { searchText } from "./searchText.js";
import { changeDirectory } from "./changeDirectory.js";
import { writeFile } from "./writeFile.js";
import { replaceInFile } from "./replaceInFile.js";
import { runScript } from "./runScript.js";
import { gitStatus } from "./gitStatus.js";
import { gitDiff } from "./gitDiff.js";
import { diffPreview } from "./diffPreview.js";

export function registerAllTools() {
  registry.register(getTime);
  registry.register(executeCommand);
  registry.register(currentDirectory);
  registry.register(listDirectory);
  registry.register(readFile);
  registry.register(searchText);
  registry.register(changeDirectory);
  registry.register(writeFile);
  registry.register(replaceInFile);
  registry.register(runScript);
  registry.register(gitStatus);
  registry.register(gitDiff);
  registry.register(diffPreview);
}
