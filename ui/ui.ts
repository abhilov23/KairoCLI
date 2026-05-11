import chalk from "chalk";
import boxen from "boxen";

export function printBanner() {
  const banner = boxen(chalk.cyan.bold("KairoCLI"), {
    padding: 1,
    borderColor: "cyan",
    borderStyle: "round",
  });

  console.log(banner);
}

export function printUser(text: string) {
  console.log(chalk.green(`\nYou > ${text}`));
}

export function printAssistant(text: string) {
  console.log(chalk.blue(`\nAI > ${text}`));
}

export function printTool(toolName: string) {
  console.log(chalk.yellow.bold(`\n[TOOL] ${toolName}`));
}

export function printError(error: string) {
  console.log(chalk.red.bold(`\n[ERROR] ${error}`));
}

export function printSuccess(text: string) {
  console.log(chalk.greenBright(`\n${text}`));
}
