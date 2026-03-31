// @ts-ignore
import parse from 'bash-parser';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// A simple recursive AST visitor
function walkNodes(node: any, visit: (n: any) => void) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  
  if (Array.isArray(node)) {
    for (const child of node) {
      walkNodes(child, visit);
    }
  } else {
    for (const key of Object.keys(node)) {
      walkNodes(node[key], visit);
    }
  }
}

export function validateCommand(command: string): ValidationResult {
  try {
    const ast = parse(command);
    
    let isDangerous = false;
    let dangerousReason = '';

    walkNodes(ast, (node) => {
      // Look for a Command node where the name comes from the AST structure
      if (node.type === 'Command' && node.name && node.name.text) {
        const cmdName = node.name.text;
        
        // Basic static analysis check: block `rm` with `-r` or `-f` and root-like targets
        if (cmdName === 'rm') {
          let hasRecursiveOrForce = false;
          let hasDangerousTarget = false;

          const args = node.suffix || [];
          for (const arg of args) {
            const text = arg.text;
            // Check for flags
            if (text === '-r' || text === '-rf' || text === '-fr' || text === '-f') {
              hasRecursiveOrForce = true;
            }
            // Check for dangerous targets
            if (text === '/' || text === '/*' || text === 'C:\\' || text === 'C:\\*') {
              hasDangerousTarget = true;
            }
          }

          if (hasRecursiveOrForce && hasDangerousTarget) {
            isDangerous = true;
            dangerousReason = `Blocked dangerous command: 'rm' with recursive/force flags targeting root.`;
          }
        }
      }
    });

    if (isDangerous) {
      return { valid: false, reason: dangerousReason };
    }

    return { valid: true };
  } catch (err: any) {
    // If it cannot be parsed by bash-parser, it might be an invalid shell syntax or Windows-specific cmd we shouldn't trust
    return { valid: false, reason: `Parse error: ${err.message}` };
  }
}
