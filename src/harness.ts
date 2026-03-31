import chalk from 'chalk';
import { executeSecurely } from './executor';
import { testPrompts } from './prompts';

async function runHarness() {
  console.log(chalk.cyan.bold('\n🚀 Starting ts-secure-shell-executor Harness'));
  console.log(chalk.gray(`Running ${testPrompts.length} benchmark prompts...`));
  console.log(chalk.gray('==================================================\n'));

  let passCount = 0;
  let failCount = 0;
  let timeoutCount = 0;
  let blockedCount = 0;

  let matchExpected = 0;

  for (const prompt of testPrompts) {
    const displayCmd = prompt.command.length > 30 ? prompt.command.substring(0, 27) + '...' : prompt.command.padEnd(30, ' ');
    process.stdout.write(chalk.gray(`[${prompt.id.toString().padStart(2, '0')}/50]`) + ` Testing: ${chalk.white(displayCmd)} `);

    // Using a fast timeout of 1500ms for responsiveness during the harness test
    const result = await executeSecurely(prompt.command, { timeoutMs: 1500 });
    
    let colorize = chalk.white;
    if (result.status === 'pass') {
      passCount++;
      colorize = chalk.green;
    } else if (result.status === 'fail') {
      failCount++;
      colorize = chalk.red;
    } else if (result.status === 'timeout') {
      timeoutCount++;
      colorize = chalk.yellow;
    } else if (result.status === 'blocked') {
      blockedCount++;
      colorize = chalk.magenta;
    }

    if (result.status === prompt.expectedBehavior) {
      matchExpected++;
      console.log(colorize(`[${result.status.padEnd(7).toUpperCase()}]`) + chalk.green(' ✅ Matches Expected'));
    } else {
      console.log(colorize(`[${result.status.padEnd(7).toUpperCase()}]`) + chalk.red(` ❌ Expected ${prompt.expectedBehavior}`));
    }
  }

  console.log(chalk.cyan.bold('\n📊 Benchmark Results'));
  console.log(chalk.gray('=================================================='));
  console.log(chalk.green(`Passed:  ${passCount}`));
  console.log(chalk.red(`Failed:  ${failCount}`));
  console.log(chalk.yellow(`Timeout: ${timeoutCount}`));
  console.log(chalk.magenta(`Blocked: ${blockedCount}`));
  
  const successRate = ((passCount / testPrompts.length) * 100).toFixed(1);
  const baselineRate = ((matchExpected / testPrompts.length) * 100).toFixed(1);

  console.log(chalk.gray('=================================================='));
  console.log(chalk.white(`Raw Execution Success Rate:     ${successRate}%`));
  console.log(chalk.cyan.bold(`Baseline Match (Harness Rate):  ${baselineRate}%`));
  console.log(chalk.gray('==================================================\n'));
}

runHarness().catch((err) => {
  console.error(chalk.red('Harness failed explicitly:'), err);
  process.exit(1);
});
