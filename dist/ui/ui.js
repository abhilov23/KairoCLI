import chalk from "chalk";
import boxen from "boxen";
import readline from "readline";
export function printBanner() {
    const banner = boxen(chalk.cyan.bold("KairoCLI"), {
        padding: 1,
        borderColor: "cyan",
        borderStyle: "round",
    });
    console.log(banner);
}
export function printUser(text) {
    console.log(chalk.green(`\nYou > ${text}`));
}
export function printAssistant(text) {
    console.log(chalk.blue(`\nAI > ${text}`));
}
export function printTool(toolName) {
    console.log(chalk.yellow.bold(`\n[TOOL] ${toolName}`));
}
export function printError(error) {
    console.log(chalk.red.bold(`\n[ERROR] ${error}`));
}
export function printSuccess(text) {
    console.log(chalk.greenBright(`\n${text}`));
}
export function getUserInput(prompt) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
