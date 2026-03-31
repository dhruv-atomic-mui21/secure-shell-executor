export interface PromptGroup {
  id: number;
  command: string;
  expectedBehavior: 'pass' | 'fail' | 'timeout' | 'blocked';
  description: string;
}

const baseTemplates: Omit<PromptGroup, 'id'>[] = [
  { command: 'echo "Baseline test"', expectedBehavior: 'pass', description: 'Basic string echo' },
  { command: 'node -e "console.log(1+1)"', expectedBehavior: 'pass', description: 'Simple Node inline script' },
  { command: 'sleep 10', expectedBehavior: 'timeout', description: 'Artificial timeout logic loop' },
  { command: 'rm -rf /', expectedBehavior: 'blocked', description: 'Dangerous root deletion (Unix style)' },
  { command: 'rm -rf C:\\', expectedBehavior: 'blocked', description: 'Dangerous root deletion (Windows style)' },
  { command: 'ls -la', expectedBehavior: 'pass', description: 'List directory entries' },
  { command: 'ping 127.0.0.1 -c 100', expectedBehavior: 'timeout', description: 'Long running ping' },
  { command: 'invalid_command_binary_xyz', expectedBehavior: 'fail', description: 'Execution failure simulation' },
  { command: 'mkdir temporary_test_dir && rmdir temporary_test_dir', expectedBehavior: 'pass', description: 'Standard I/O ops' },
  { command: 'ping 127.0.0.1 -n 10 > NUL', expectedBehavior: 'timeout', description: 'Infinite loop simulation block' }
];

// Generate exactly 50 prompts to match the baseline benchmark from the proposal
export const testPrompts: PromptGroup[] = Array.from({ length: 50 }, (_, i) => {
  const base = baseTemplates[i % baseTemplates.length];
  
  // Create slight variations so they aren't completely identical
  let dynamicCommand = base.command;
  if (dynamicCommand.includes('echo')) {
    dynamicCommand = `echo "Baseline test ${i}"`;
  } else if (dynamicCommand.includes('invalid_command')) {
    dynamicCommand = `invalid_command_binary_xyz_${i}`;
  }

  return {
    id: i + 1,
    command: dynamicCommand,
    expectedBehavior: base.expectedBehavior,
    description: `${base.description} (Iteration ${i + 1})`
  };
});
