
# ts-secure-shell-executor

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![GSoC](https://img.shields.io/badge/GSoC-2026-F9AB00?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)

**A standalone TypeScript/Node.js test harness and secure shell executor.** 

This project demonstrates deterministic tool execution via AST parsing (`bash-parser`) and robust child process lifecycle management using Node's `AbortController`. It serves as the baseline test harness for our Gemini CLI implementation.

---

## Key Features

1. **AST-Based Command Validation**
   - Parses incoming shell commands into Abstract Syntax Trees (ASTs).
   - Blocks dangerous patterns structurally (e.g., `rm -rf /` or recursive deletions of critical OS paths) before execution.
   - Prevents simple string-bypass heuristics by analyzing actual shell `Command` node arguments and flags.

2. **AbortController Process Management**
   - Wraps raw `child_process.spawn` calls using the native `AbortController`.
   - Enforces hard timeouts strictly at the operating system scheduling level to prevent hanging agents or infinite loops.

3. **50-Prompt Baseline Test Harness**
   - Contains a rigorously constructed 50-prompt test suite.
   - Measures the baseline execution success rate reflecting realistic edge cases across Ubuntu & Windows environments.
   - Distinguishes visually between [PASS], [FAIL], [TIMEOUT], and safety [BLOCKED] statuses.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- TypeScript (`npm i -g typescript ts-node`)

### Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/yourusername/ts-secure-shell-executor.git
cd ts-secure-shell-executor
npm install
```

### Running the Test Harness
Execute the 50-prompt benchmark natively:
```bash
npm run harness
```

## Architecture

- `src/validator.ts`: The static analysis layer. Parses strings using `bash-parser` and walks the syntactic tree to block specifically modeled malicious instructions.
- `src/executor.ts`: The deterministic runtime boundary. Accepts validated code, injects the `signal` from an `AbortController` into `spawn()`, and enforces a timeout ceiling.
- `src/prompts.ts`: Data file housing 50 iterations of execution profiles (standard ops, timeouts, explicit failures, and dangerous commands).
- `src/harness.ts`: An asynchronous, beautifully styled CLI runner that pipes the prompts through the secure executor and aggregates the success rate.

---
*Created as part of the Gemini CLI System Proposal for GSoC.*
