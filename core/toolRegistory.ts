// Tools
import { getTime } from "../tools/getTime.js";
import { executeCommandTool } from "../tools/execCommand.js";
import { currentDirectoryTool } from "../tools/currentDirectory.js";
import { listDirectoryTool } from "../tools/listDirectory.js";
import { readFileTool } from "../tools/readFile.js";
import { searchTextTool } from "../tools/searchText.js";
import { changeDirectoryTool } from "../tools/changeDirectory.js";
import { writeFileTool } from "../tools/writeFile.js";
import { replaceInFileTool } from "../tools/replaceInFile.js";
import { runScriptTool } from "../tools/runScript.js";
import { gitStatusTool } from "./gitStatus.js";

import model from "../model/model.js";

const tools = [
  getTime,
  executeCommandTool,
  currentDirectoryTool,
  listDirectoryTool,
  readFileTool,
  searchTextTool,
  changeDirectoryTool,
  writeFileTool,
  replaceInFileTool,
  runScriptTool,
  gitStatusTool,
];

const modelWithTools = model.bindTools(tools);

const availableToolNames = Object.freeze([
  "get_time",
  "execute_command",
  "current_directory",
  "list_directory",
  "read_file",
  "search_text",
  "change_directory",
  "write_file",
  "replace_in_file",
  "run_script",
  "git_status",
]);

const toolMap: Record<string, any> = Object.freeze({
  get_time: getTime,
  execute_command: executeCommandTool,
  current_directory: currentDirectoryTool,
  list_directory: listDirectoryTool,
  read_file: readFileTool,
  search_text: searchTextTool,
  change_directory: changeDirectoryTool,
  write_file: writeFileTool,
  replace_in_file: replaceInFileTool,
  run_script: runScriptTool,
  git_status: gitStatusTool,
});

const shouldDisplayRawOutput = Object.freeze([
  "execute_command",
  "list_directory",
  "read_file",
  "search_text",
  "git_status",
]);

export {
  modelWithTools,
  availableToolNames,
  toolMap,
  shouldDisplayRawOutput,
  tools,
};
