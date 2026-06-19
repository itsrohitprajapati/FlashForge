// import { GoogleGenAI, Type } from "@google/genai";
// import readlinesync from "readline-sync";
// import { exec } from "child_process";
// import "dotenv/config.js";
// import util from "util";
// import os from "os";

// const History = [];
// const platform = os.platform();
// const execute = util.promisify(exec);

// // Configure the client
// const ai = new GoogleGenAI({apiKey: ""});

// async function executeCommand({command}) {
//     try {
//         const {stdout, stderr} = await execute(command);
//         if (stderr) {
//             return `Error: ${stderr}`;
//         }
//         return `Success: ${stdout}`;
//     } catch (err) {
//         return `Error: ${err}`;
//     }
// }

// const commandExecuter = {
//     name: "executeCommand",
//     description: "It gets any shell/terminal command to be executed. Helps in operations like read, write, update and delete for any folder or file.",
//     parameters: {
//         type: Type.OBJECT,
//         properties: {
//             command: {
//                 type: Type.STRING,
//                 description: "It is the shell/terminal command for execution, Example - mkdir calculator, touch caculator/index.js, etc.",
//             },
//         },
//         required: ['command'],
//     }
// }

// async function build() {

//     while (true) {

//     const result = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     // history: History,
//     contents: History,
//     config: {
//         systemInstruction: ` You are a Website Builder AI that generates frontend-only shell/terminal commands.

// Platform Context:
// - Current platform: ${platform}
// - Detect and adapt commands for Windows, macOS, or Linux.

// Responsibilities:
// - Build and modify frontend assets (HTML, CSS, JS, frameworks, assets).
// - Output one command at a time.
// - Wait for execution results before generating the next command.
// - It should also handle multiline write efficiently.

// Rules:
// - Commands must be strictly related to frontend website development.
// - Do NOT generate commands for system administration, networking, security, exploitation, or non-website tasks.
// - Do NOT delete files outside the project scope.
// - Do NOT explain commands unless explicitly asked.
// - Never execute commands yourself.

// Scope & Behavior:
// - Stay strictly within the website-building context.
// - Refuse unrelated requests with a brief, rude, dismissive response that redirects to website tasks.

// Output:
// - Always respond with a single shell/terminal command OR a refusal message.
// - Never combine commands.
// - Never access sensitive data or modify files outside the website project directory.

// Before responding (CRITICAL):
// - Check for missing quotes.
// - Check for platform-specific syntax.
// - Check that the command can run standalone.
// - If any check fails, fix it before responding.
// - Fix the errors, if there are any.
// - No errors should be there in the js file (check before execution).

//     `,
//         tools: [{
//             functionDeclarations: [commandExecuter],
//         }],
//     },
//     });

//     if (result.functionCalls && result.functionCalls.length > 0) {

//         const functionCall = result.functionCalls[0];
//         const {name,args} = functionCall;

//         const toolResponse = await executeCommand(args);

//         const functionResponsePart = {
//                 name: functionCall.name,
//                 response: {
//                     result: toolResponse,
//                 },
//             };

//             History.push({
//                 role: "model",
//                 parts: [
//                     {
//                     functionCall: functionCall,
//                     },
//                 ],
//             });

//             History.push({
//                 role: "user",
//                 parts: [
//                     {
//                     functionResponse: functionResponsePart,
//                     },
//                 ],
//             });

//     } else {
//         console.log(result.text);
//         History.push({
//             role: "model",
//             parts: [{text: result.text}],
//         });
//         break;
//     }
// }
    
// }

// while (true) {

//     const question = readlinesync.question("Ask: ");

//     if (question == "exit") {
//         break;
//     }

//     History.push({
//         role: "user",
//         parts: [{text: question}],
//     });

//     await build();

// }


// import { GoogleGenAI, Type } from "@google/genai";
// import readlinesync from "readline-sync";
// import { exec } from "child_process";
// import "dotenv/config.js";
// import util from "util";
// import os from "os";
// import path from "path";
// import fs from "fs";

// // ─── Config ──────────────────────────────────────────────────────────────────

// const CONFIG = {
//   MAX_COMMAND_LENGTH: 2000,
//   EXECUTION_TIMEOUT_MS: 30_000,
//   MAX_TURNS_PER_SESSION: 50,
//   MAX_INPUT_LENGTH: 1000,
//   RATE_LIMIT_REQUESTS: 10,
//   RATE_LIMIT_WINDOW_MS: 60_000,
//   LOG_FILE: "./builder-audit.log",
//   PROJECT_DIR: path.resolve("./website-project"),
// };

// // ─── Environment validation ───────────────────────────────────────────────────

// function validateEnvironment() {
//   if (!process.env.GOOGLE_API_KEY) {
//     fatal("Missing GOOGLE_API_KEY in environment. Create a .env file.");
//   }
//   // Ensure the sandboxed project directory exists
//   if (!fs.existsSync(CONFIG.PROJECT_DIR)) {
//     fs.mkdirSync(CONFIG.PROJECT_DIR, { recursive: true });
//   }
// }

// function fatal(msg) {
//   console.error(`[FATAL] ${msg}`);
//   process.exit(1);
// }

// // ─── Audit logger ─────────────────────────────────────────────────────────────

// function auditLog(event, detail = "") {
//   const entry = `[${new Date().toISOString()}] [${event}] ${detail}\n`;
//   try {
//     fs.appendFileSync(CONFIG.LOG_FILE, entry, "utf8");
//   } catch {
//     // Non-fatal: logging failure should never crash the app
//   }
// }

// // ─── Rate limiter ─────────────────────────────────────────────────────────────

// const rateLimiter = (() => {
//   const timestamps = [];
//   return {
//     check() {
//       const now = Date.now();
//       while (timestamps.length && now - timestamps[0] > CONFIG.RATE_LIMIT_WINDOW_MS) {
//         timestamps.shift();
//       }
//       if (timestamps.length >= CONFIG.RATE_LIMIT_REQUESTS) {
//         const waitMs = CONFIG.RATE_LIMIT_WINDOW_MS - (now - timestamps[0]);
//         throw new RateLimitError(`Rate limit hit. Wait ${Math.ceil(waitMs / 1000)}s.`);
//       }
//       timestamps.push(now);
//     },
//   };
// })();

// class RateLimitError extends Error {}

// // ─── Security: allowed command tokens & blocked patterns ─────────────────────

// /**
//  * Allowed executable binaries (exact name, no path).
//  * Only frontend-development tools are permitted.
//  */
// const ALLOWED_BINARIES = new Set([
//   // File & directory management
//   "mkdir", "touch", "cp", "mv", "ls", "find", "cat", "echo", "printf",
//   "head", "tail", "wc", "grep", "sed", "awk", "sort", "uniq",
//   // Node / package managers
//   "node", "npm", "npx", "pnpm", "yarn", "bun",
//   // Version control (read-only dev ops)
//   "git",
//   // Build tools
//   "vite", "webpack", "parcel", "rollup", "esbuild",
//   // Linters / formatters
//   "eslint", "prettier", "stylelint",
//   // Misc dev utilities
//   "tee", "tr", "curl", // curl is allowed only for CDN/asset fetching — blocked patterns catch abuse
// ]);

// /**
//  * Blocked patterns — regex tested against the FULL raw command string.
//  * Any match causes an immediate rejection regardless of binary.
//  */
// const BLOCKED_PATTERNS = [
//   // System administration
//   /\bpasswd\b/i,
//   /\bsudo\b/i,
//   /\bsu\s/i,
//   /\bchmod\b/i,
//   /\bchown\b/i,
//   /\buseradd\b/i,
//   /\buserdel\b/i,
//   /\bgroupadd\b/i,
//   /\bcron\b/i,
//   /\bsystemctl\b/i,
//   /\bservice\b/i,
//   /\blaunchctl\b/i,

//   // Networking / exfiltration
//   /\bnc\b/i,
//   /\bnetcat\b/i,
//   /\bnmap\b/i,
//   /\btelnet\b/i,
//   /\bssh\b/i,
//   /\bscp\b/i,
//   /\brsync\b/i,
//   /\bwget\b/i,
//   /curl\s+.*(-d\s|--data|--upload|-T\s|--ftp)/i, // curl exfil patterns

//   // Dangerous file ops
//   /\brm\s+-rf?\s+(\/|~|\.\.)/i,           // rm -rf / or rm -rf ..
//   /\bdd\b/i,
//   /\bmkfs\b/i,
//   /\bfdisk\b/i,
//   /\bformat\b/i,
//   />\s*\/dev\//i,                          // writing to device files
//   /\/etc\//i,                              // touching /etc
//   /\/proc\//i,
//   /\/sys\//i,

//   // Shell injection vectors
//   /[`]/,                                   // backtick execution
//   /\$\(/,                                  // command substitution $(...)
//   /\beval\b/i,
//   /\bexec\b/i,
//   /;\s*(bash|sh|zsh|fish|ksh|csh)/i,      // chaining into a shell
//   /\|\s*(bash|sh|zsh|fish|ksh|csh)/i,

//   // Env / secrets exfiltration
//   /\benv\b/i,
//   /\bprintenv\b/i,
//   /\bexport\s+/i,
//   /\.env/i,
//   /process\.env/i,

//   // Sensitive paths
//   /~\/.ssh/i,
//   /~\/.aws/i,
//   /~\/.config/i,
//   /\/private\//i,
//   /\/var\/log/i,

//   // Python / Ruby / Perl exec
//   /\bpython[23]?\b/i,
//   /\bruby\b/i,
//   /\bperl\b/i,
//   /\bphp\b/i,

//   // Crypto miners & known attack tools
//   /\bxmrig\b/i,
//   /\bminerd\b/i,
//   /\bmsf\b/i,
//   /\bmetasploit\b/i,
// ];

// /**
//  * Extracts the first binary name from a shell command string.
//  * Handles `cd && binary`, pipes, and semicolons by checking the FIRST token.
//  */
// function extractBinary(command) {
//   // Strip leading whitespace and env var assignments like FOO=bar cmd
//   const stripped = command.trim().replace(/^(\w+=\S+\s+)+/, "");
//   return stripped.split(/\s+/)[0].toLowerCase().replace(/^.*\//, ""); // basename only
// }

// /**
//  * Ensures the command does not attempt path traversal out of the project dir.
//  * Not a substitute for OS-level sandboxing, but adds a layer of defense.
//  */
// function containsPathTraversal(command) {
//   // Reject absolute paths not starting with the project dir
//   const absolutePaths = command.match(/\/[^\s"']+/g) || [];
//   for (const p of absolutePaths) {
//     const resolved = path.resolve(p);
//     if (!resolved.startsWith(CONFIG.PROJECT_DIR) && !isAllowedSystemPath(resolved)) {
//       return true;
//     }
//   }
//   return false;
// }

// function isAllowedSystemPath(resolved) {
//   // Allow read from common binary locations only
//   const allowedPrefixes = ["/usr", "/bin", "/opt", "/home", "/tmp", "/private/tmp"];
//   return allowedPrefixes.some((prefix) => resolved.startsWith(prefix));
// }

// // ─── Core validator ───────────────────────────────────────────────────────────

// function validateCommand(command) {
//   if (typeof command !== "string") {
//     return { ok: false, reason: "Command must be a string." };
//   }
//   if (command.trim().length === 0) {
//     return { ok: false, reason: "Empty command." };
//   }
//   if (command.length > CONFIG.MAX_COMMAND_LENGTH) {
//     return { ok: false, reason: "Command exceeds maximum length." };
//   }

//   // Check blocked patterns first (fast exit)
//   for (const pattern of BLOCKED_PATTERNS) {
//     if (pattern.test(command)) {
//       return { ok: false, reason: `Blocked pattern detected: ${pattern}` };
//     }
//   }

//   // Check binary allowlist
//   const binary = extractBinary(command);
//   if (!ALLOWED_BINARIES.has(binary)) {
//     return { ok: false, reason: `Binary '${binary}' is not permitted.` };
//   }

//   // Path traversal guard
//   if (containsPathTraversal(command)) {
//     return { ok: false, reason: "Command references paths outside the project directory." };
//   }

//   return { ok: true };
// }

// // ─── Executor ─────────────────────────────────────────────────────────────────

// const execute = util.promisify(exec);

// async function executeCommand({ command }) {
//   const validation = validateCommand(command);

//   if (!validation.ok) {
//     auditLog("BLOCKED", `reason="${validation.reason}" cmd="${command}"`);
//     return `[SECURITY] Command rejected: ${validation.reason}`;
//   }

//   auditLog("EXEC", `cmd="${command}"`);

//   try {
//     const { stdout, stderr } = await execute(command, {
//       timeout: CONFIG.EXECUTION_TIMEOUT_MS,
//       cwd: CONFIG.PROJECT_DIR,         // sandbox: all commands run inside project dir
//       maxBuffer: 1024 * 1024,          // 1 MB output cap
//       env: {
//         // Minimal, clean environment — no secrets leaked to child process
//         PATH: process.env.PATH,
//         HOME: CONFIG.PROJECT_DIR,
//         NODE_ENV: "development",
//         TERM: "dumb",
//       },
//     });

//     if (stderr) {
//       auditLog("STDERR", stderr.trim().slice(0, 200));
//       return `Warning: ${stderr.trim()}`;
//     }
//     return `Success:\n${stdout.trim()}`;
//   } catch (err) {
//     if (err.killed) {
//       auditLog("TIMEOUT", `cmd="${command}"`);
//       return `Error: Command timed out after ${CONFIG.EXECUTION_TIMEOUT_MS / 1000}s.`;
//     }
//     auditLog("ERROR", err.message.slice(0, 200));
//     return `Error: ${err.message}`;
//   }
// }

// // ─── Tool definition ──────────────────────────────────────────────────────────

// const commandExecutorTool = {
//   name: "executeCommand",
//   description:
//     "Executes a single shell/terminal command strictly for frontend web development tasks " +
//     "(file creation, npm operations, build tools). One command at a time.",
//   parameters: {
//     type: Type.OBJECT,
//     properties: {
//       command: {
//         type: Type.STRING,
//         description:
//           "A single, standalone shell command. Example: mkdir src, touch src/index.html, " +
//           "npm install tailwindcss. No chaining with && or ;.",
//       },
//     },
//     required: ["command"],
//   },
// };

// // ─── System prompt ────────────────────────────────────────────────────────────

// const platform = os.platform();

// const SYSTEM_PROMPT = `You are a Website Builder AI. Your ONLY job is to build frontend websites.

// ## Environment
// - Platform: ${platform}
// - Working directory: ${CONFIG.PROJECT_DIR}
// - All commands execute inside this directory; do NOT use absolute paths.

// ## Strict Rules
// 1. Output ONE shell command at a time via the executeCommand tool.
// 2. Wait for the execution result before issuing the next command.
// 3. ONLY use commands related to: HTML, CSS, JavaScript, npm packages, build tools (Vite, Webpack, Parcel), linters, formatters, and static asset management.
// 4. NEVER generate: system admin commands, password changes, network scans, environment variable access, file reads outside the project, or any command outside web development.
// 5. Do NOT use command chaining (&&, ;, |) for anything other than piping build-tool output.
// 6. Do NOT use backticks or $() subshells.
// 7. Validate syntax before outputting any command — especially quoting in echo/printf for multi-line writes.
// 8. If asked to do anything unrelated to website building, refuse with: "I only build websites. Ask me something about that."

// ## Output format
// - Tool call → one command.
// - Final message → brief summary of what was built/changed.
// - No explanations unless asked.`;

// // ─── AI client ────────────────────────────────────────────────────────────────

// const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// // ─── Build loop ───────────────────────────────────────────────────────────────

// async function build(history, sessionTurns) {
//   let turns = sessionTurns;

//   while (true) {
//     if (turns >= CONFIG.MAX_TURNS_PER_SESSION) {
//       console.warn("[LIMIT] Max turns per session reached. Start a new session.");
//       return turns;
//     }

//     rateLimiter.check(); // throws RateLimitError if exceeded

//     const result = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: history,
//       config: {
//         systemInstruction: SYSTEM_PROMPT,
//         tools: [{ functionDeclarations: [commandExecutorTool] }],
//       },
//     });

//     turns++;

//     if (result.functionCalls && result.functionCalls.length > 0) {
//       const functionCall = result.functionCalls[0];
//       const { name, args } = functionCall;

//       // Secondary guard: only allow the declared tool name
//       if (name !== "executeCommand") {
//         console.warn(`[SECURITY] Unexpected tool call: ${name}`);
//         auditLog("UNEXPECTED_TOOL", name);
//         break;
//       }

//       const toolResponse = await executeCommand(args);
//       console.log(`\n[CMD] ${args.command}`);
//       console.log(`[OUT] ${toolResponse}\n`);

//       history.push({
//         role: "model",
//         parts: [{ functionCall }],
//       });
//       history.push({
//         role: "user",
//         parts: [{ functionResponse: { name, response: { result: toolResponse } } }],
//       });
//     } else {
//       const text = result.text ?? "(no response)";
//       console.log(`\n[AI] ${text}\n`);
//       history.push({ role: "model", parts: [{ text }] });
//       break;
//     }
//   }

//   return turns;
// }

// // ─── Input sanitizer ─────────────────────────────────────────────────────────

// function sanitizeInput(input) {
//   if (typeof input !== "string") return "";
//   // Strip control characters except newline/tab
//   return input.replace(/[^\x09\x0A\x20-\x7E]/g, "").trim().slice(0, CONFIG.MAX_INPUT_LENGTH);
// }

// // ─── Main REPL ────────────────────────────────────────────────────────────────

// async function main() {
//   validateEnvironment();

//   console.log("╔════════════════════════════════════════╗");
//   console.log("║       Website Builder AI  v1.0.0       ║");
//   console.log("║  Type your request. 'exit' to quit.    ║");
//   console.log(`║  Project dir: ${CONFIG.PROJECT_DIR.slice(-24).padStart(24)} ║`);
//   console.log("╚════════════════════════════════════════╝\n");

//   auditLog("SESSION_START", `platform=${platform}`);

//   const history = [];
//   let sessionTurns = 0;

//   while (true) {
//     const raw = readlinesync.question("You: ");
//     const question = sanitizeInput(raw);

//     if (question.toLowerCase() === "exit") {
//       auditLog("SESSION_END", `turns=${sessionTurns}`);
//       console.log("Goodbye.");
//       break;
//     }

//     if (!question) {
//       console.log("[!] Empty input ignored.\n");
//       continue;
//     }

//     history.push({ role: "user", parts: [{ text: question }] });

//     try {
//       sessionTurns = await build(history, sessionTurns);
//     } catch (err) {
//       if (err instanceof RateLimitError) {
//         console.warn(`[RATE LIMIT] ${err.message}\n`);
//         history.pop(); // remove the failed user message
//       } else {
//         console.error(`[ERROR] ${err.message}\n`);
//         auditLog("UNCAUGHT", err.message.slice(0, 300));
//         history.pop();
//       }
//     }
//   }
// }

// main();

import { GoogleGenAI, Type } from "@google/genai";
import readlinesync from "readline-sync";
import { exec } from "child_process";
import "dotenv/config.js";
import util from "util";
import os from "os";
import path from "path";
import fs from "fs";

// Config

const CONFIG = {
  MAX_COMMAND_LENGTH: 2000,
  EXECUTION_TIMEOUT_MS: 30_000,
  MAX_TURNS_PER_SESSION: 50,
  MAX_INPUT_LENGTH: 1000,
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60_000,
  LOG_FILE: "./builder-audit.log",
  PROJECT_DIR: path.resolve("./website-project"),
};

// Environment validation

function validateEnvironment() {
  if (!process.env.GOOGLE_API_KEY) {
    fatal("Missing GOOGLE_API_KEY in environment. Create a .env file.");
  }
  // Ensure the sandboxed project directory exists
  if (!fs.existsSync(CONFIG.PROJECT_DIR)) {
    fs.mkdirSync(CONFIG.PROJECT_DIR, { recursive: true });
  }
}

function fatal(msg) {
  console.error(`[FATAL] ${msg}`);
  process.exit(1);
}

// Audit logger

function auditLog(event, detail = "") {
  const entry = `[${new Date().toISOString()}] [${event}] ${detail}\n`;
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, entry, "utf8");
  } catch {
    // Non-fatal: logging failure should never crash the app
  }
}

// Rate limiter

const rateLimiter = (() => {
  const timestamps = [];
  return {
    check() {
      const now = Date.now();
      while (timestamps.length && now - timestamps[0] > CONFIG.RATE_LIMIT_WINDOW_MS) {
        timestamps.shift();
      }
      if (timestamps.length >= CONFIG.RATE_LIMIT_REQUESTS) {
        const waitMs = CONFIG.RATE_LIMIT_WINDOW_MS - (now - timestamps[0]);
        throw new RateLimitError(`Rate limit hit. Wait ${Math.ceil(waitMs / 1000)}s.`);
      }
      timestamps.push(now);
    },
  };
})();

class RateLimitError extends Error {}

// Security: allowed command tokens & blocked patterns

/*
 * Allowed executable binaries (exact name, no path).
 * Only frontend-development tools are permitted.
*/
const ALLOWED_BINARIES = new Set([
  // File & directory management
  "mkdir", "touch", "cp", "mv", "ls", "find", "cat", "echo", "printf",
  "head", "tail", "wc", "grep", "sed", "awk", "sort", "uniq",
  // Node / package managers
  "node", "npm", "npx", "pnpm", "yarn", "bun",
  // Version control (read-only dev ops)
  "git",
  // Build tools
  "vite", "webpack", "parcel", "rollup", "esbuild",
  // Linters / formatters
  "eslint", "prettier", "stylelint",
  // Misc dev utilities
  "tee", "tr", "curl", // curl is allowed only for CDN/asset fetching — blocked patterns catch abuse
]);

/**
 * Blocked patterns — regex tested against the FULL raw command string.
 * Any match causes an immediate rejection regardless of binary.
 */
const BLOCKED_PATTERNS = [
  // System administration
  /\bpasswd\b/i,
  /\bsudo\b/i,
  /\bsu\s/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\buseradd\b/i,
  /\buserdel\b/i,
  /\bgroupadd\b/i,
  /\bcron\b/i,
  /\bsystemctl\b/i,
  /\bservice\b/i,
  /\blaunchctl\b/i,

  // Networking / exfiltration
  /\bnc\b/i,
  /\bnetcat\b/i,
  /\bnmap\b/i,
  /\btelnet\b/i,
  /\bssh\b/i,
  /\bscp\b/i,
  /\brsync\b/i,
  /\bwget\b/i,
  /curl\s+.*(-d\s|--data|--upload|-T\s|--ftp)/i, // curl exfil patterns

  // Dangerous file ops
  /\brm\s+-rf?\s+(\/|~|\.\.)/i,           // rm -rf / or rm -rf ..
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bfdisk\b/i,
  /\bformat\b/i,
  />\s*\/dev\//i,                          // writing to device files
  /\/etc\//i,                              // touching /etc
  /\/proc\//i,
  /\/sys\//i,

  // Shell injection vectors
  /[`]/,                                   // backtick execution
  /\$\(/,                                  // command substitution $(...)
  /\beval\b/i,
  /\bexec\b/i,
  /;\s*(bash|sh|zsh|fish|ksh|csh)/i,      // chaining into a shell
  /\|\s*(bash|sh|zsh|fish|ksh|csh)/i,

  // Env / secrets exfiltration
  /\benv\b/i,
  /\bprintenv\b/i,
  /\bexport\s+/i,
  /\.env/i,
  /process\.env/i,

  // Sensitive paths
  /~\/.ssh/i,
  /~\/.aws/i,
  /~\/.config/i,
  /\/private\//i,
  /\/var\/log/i,

  // Python / Ruby / Perl exec
  /\bpython[23]?\b/i,
  /\bruby\b/i,
  /\bperl\b/i,
  /\bphp\b/i,

  // Crypto miners & known attack tools
  /\bxmrig\b/i,
  /\bminerd\b/i,
  /\bmsf\b/i,
  /\bmetasploit\b/i,
];

/**
 * Extracts the first binary name from a shell command string.
 * Handles `cd && binary`, pipes, and semicolons by checking the FIRST token.
 */
function extractBinary(command) {
  // Strip leading whitespace and env var assignments like FOO=bar cmd
  const stripped = command.trim().replace(/^(\w+=\S+\s+)+/, "");
  return stripped.split(/\s+/)[0].toLowerCase().replace(/^.*\//, ""); // basename only
}

/**
 * Ensures the command does not attempt path traversal out of the project dir.
 * Not a substitute for OS-level sandboxing, but adds a layer of defense.
 */
function containsPathTraversal(command) {
  // Reject absolute paths not starting with the project dir
  const absolutePaths = command.match(/\/[^\s"']+/g) || [];
  for (const p of absolutePaths) {
    const resolved = path.resolve(p);
    if (!resolved.startsWith(CONFIG.PROJECT_DIR) && !isAllowedSystemPath(resolved)) {
      return true;
    }
  }
  return false;
}

function isAllowedSystemPath(resolved) {
  // Allow read from common binary locations only
  const allowedPrefixes = ["/usr", "/bin", "/opt", "/home", "/tmp", "/private/tmp"];
  return allowedPrefixes.some((prefix) => resolved.startsWith(prefix));
}

// Core validator

function validateCommand(command) {
  if (typeof command !== "string") {
    return { ok: false, reason: "Command must be a string." };
  }
  if (command.trim().length === 0) {
    return { ok: false, reason: "Empty command." };
  }
  if (command.length > CONFIG.MAX_COMMAND_LENGTH) {
    return { ok: false, reason: "Command exceeds maximum length." };
  }

  // Check blocked patterns first (fast exit)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { ok: false, reason: `Blocked pattern detected: ${pattern}` };
    }
  }

  // Check binary allowlist
  const binary = extractBinary(command);
  if (!ALLOWED_BINARIES.has(binary)) {
    return { ok: false, reason: `Binary '${binary}' is not permitted.` };
  }

  // Path traversal guard
  if (containsPathTraversal(command)) {
    return { ok: false, reason: "Command references paths outside the project directory." };
  }

  return { ok: true };
}

// Executor

const execute = util.promisify(exec);

async function executeCommand({ command }) {
  const validation = validateCommand(command);

  if (!validation.ok) {
    auditLog("BLOCKED", `reason="${validation.reason}" cmd="${command}"`);
    return `[SECURITY] Command rejected: ${validation.reason}`;
  }

  auditLog("EXEC", `cmd="${command}"`);

  try {
    const { stdout, stderr } = await execute(command, {
      timeout: CONFIG.EXECUTION_TIMEOUT_MS,
      cwd: CONFIG.PROJECT_DIR,         // sandbox: all commands run inside project dir
      maxBuffer: 1024 * 1024,          // 1 MB output cap
      env: {
        // Minimal, clean environment — no secrets leaked to child process
        PATH: process.env.PATH,
        HOME: CONFIG.PROJECT_DIR,
        NODE_ENV: "development",
        TERM: "dumb",
      },
    });

    if (stderr) {
      auditLog("STDERR", stderr.trim().slice(0, 200));
      return `Warning: ${stderr.trim()}`;
    }
    return `Success:\n${stdout.trim()}`;
  } catch (err) {
    if (err.killed) {
      auditLog("TIMEOUT", `cmd="${command}"`);
      return `Error: Command timed out after ${CONFIG.EXECUTION_TIMEOUT_MS / 1000}s.`;
    }
    auditLog("ERROR", err.message.slice(0, 200));
    return `Error: ${err.message}`;
  }
}

// writeFile handler

const ALLOWED_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".ts", ".jsx", ".tsx",
  ".json", ".md", ".svg", ".txt", ".yaml", ".yml",
  ".env.example", // allow example env templates, never .env itself
]);

async function writeFile({ filePath, content }) {
  // Sanitize and resolve path inside project dir only
  const safeRel = filePath.replace(/^[/\\]+/, ""); // strip leading slashes
  const resolved = path.resolve(CONFIG.PROJECT_DIR, safeRel);

  // Guard 1: must stay inside project dir
  if (!resolved.startsWith(CONFIG.PROJECT_DIR + path.sep) && resolved !== CONFIG.PROJECT_DIR) {
    auditLog("WRITE_BLOCKED", `path traversal attempt: ${filePath}`);
    return "[SECURITY] Write rejected: path is outside the project directory.";
  }

  // Guard 2: extension allowlist
  const ext = path.extname(resolved).toLowerCase();
  const basename = path.basename(resolved).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_EXTENSIONS.has(basename)) {
    auditLog("WRITE_BLOCKED", `disallowed extension: ${ext} for ${filePath}`);
    return `[SECURITY] Write rejected: file type '${ext}' is not allowed.`;
  }

  // Guard 3: block .env (only .env.example is permitted)
  if (basename === ".env") {
    auditLog("WRITE_BLOCKED", `.env write attempt`);
    return "[SECURITY] Write rejected: cannot write to .env files.";
  }

  // Guard 4: content size cap (500 KB)
  if (Buffer.byteLength(content, "utf8") > 500 * 1024) {
    return "[SECURITY] Write rejected: content exceeds 500 KB limit.";
  }

  try {
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, "utf8");
    auditLog("WRITE", `file="${resolved}" bytes=${Buffer.byteLength(content, "utf8")}`);
    return `Success: Written ${Buffer.byteLength(content, "utf8")} bytes to ${safeRel}`;
  } catch (err) {
    auditLog("WRITE_ERROR", err.message);
    return `Error: ${err.message}`;
  }
}

// Tool definitions

const commandExecutorTool = {
  name: "executeCommand",
  description:
    "Executes a single shell/terminal command for frontend tasks: " +
    "mkdir, npm install, npx, git init, running build tools. " +
    "Do NOT use this to write file content — use writeFile instead.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description:
          "A single standalone shell command. Example: mkdir src, npm install tailwindcss. " +
          "No chaining with && or ;.",
      },
    },
    required: ["command"],
  },
};

const writeFileTool = {
  name: "writeFile",
  description:
    "Writes text content directly to a file inside the project directory. " +
    "Use this for ALL file content writes: HTML, CSS, JS, JSON, config files, etc. " +
    "Prefer this over echo/printf shell commands for any file content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: {
        type: Type.STRING,
        description:
          "Relative path from the project root. Example: index.html, src/style.css, components/Header.jsx",
      },
      content: {
        type: Type.STRING,
        description: "The full text content to write to the file.",
      },
    },
    required: ["filePath", "content"],
  },
};

// System prompt

const platform = os.platform();

const SYSTEM_PROMPT = `You are a Website Builder AI. Your ONLY job is to build frontend websites.

## Environment
- Platform: ${platform}
- Project directory: ${CONFIG.PROJECT_DIR}
- All operations are sandboxed inside this directory.

## Tools Available
You have TWO tools — use the right one for each job:

| Task                                  | Tool            |
|---------------------------------------|-----------------|
| Create folders                        | executeCommand  |
| Install npm packages                  | executeCommand  |
| Run build tools (vite, webpack, etc.) | executeCommand  |
| git init / git add / git commit       | executeCommand  |
| Write ANY file content                | writeFile       |
| Update ANY file content               | writeFile       |

**CRITICAL**: NEVER use echo, printf, or cat to write file content. Always use the writeFile tool.

## Strict Rules
1. One tool call at a time. Wait for the result before the next call.
2. Use writeFile for ALL HTML, CSS, JS, JSON, config, and markdown file content.
3. Use executeCommand only for shell operations (mkdir, npm, npx, git, build tools).
4. NEVER generate system admin commands, password changes, env var access, or anything unrelated to web development.
5. Do NOT chain shell commands with &&, ;, or use backticks / \$() subshells.
6. File paths in writeFile must be relative (e.g., index.html, src/app.js). No leading slashes.
7. If asked to do anything unrelated to website building, refuse with: "I only build websites."

## Output format
- Tool call → one operation at a time.
- Final message → brief summary of what was built/changed.
- No explanations unless asked.`;

// AI client

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Build loop

async function build(history, sessionTurns) {
  let turns = sessionTurns;

  while (true) {
    if (turns >= CONFIG.MAX_TURNS_PER_SESSION) {
      console.warn("[LIMIT] Max turns per session reached. Start a new session.");
      return turns;
    }

    rateLimiter.check(); // throws RateLimitError if exceeded

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [commandExecutorTool, writeFileTool] }],
      },
    });

    turns++;

    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      const { name, args } = functionCall;

      // Dispatch to the correct handler
      let toolResponse;
      if (name === "executeCommand") {
        toolResponse = await executeCommand(args);
        console.log(`\n[CMD] ${args.command}`);
        console.log(`[OUT] ${toolResponse}\n`);
      } else if (name === "writeFile") {
        toolResponse = await writeFile(args);
        const preview = (args.content ?? "").slice(0, 80).replace(/\n/g, "↵");
        console.log(`\n[WRITE] ${args.filePath}`);
        console.log(`[CONTENT PREVIEW] ${preview}…`);
        console.log(`[OUT] ${toolResponse}\n`);
      } else {
        console.warn(`[SECURITY] Unexpected tool call: ${name}`);
        auditLog("UNEXPECTED_TOOL", name);
        toolResponse = `[SECURITY] Tool '${name}' is not permitted.`;
      }

      history.push({
        role: "model",
        parts: [{ functionCall }],
      });
      history.push({
        role: "user",
        parts: [{ functionResponse: { name, response: { result: toolResponse } } }],
      });
    } else {
      const text = result.text ?? "(no response)";
      console.log(`\n[AI] ${text}\n`);
      history.push({ role: "model", parts: [{ text }] });
      break;
    }
  }

  return turns;
}

// Input sanitizer

function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  // Strip control characters except newline/tab
  return input.replace(/[^\x09\x0A\x20-\x7E]/g, "").trim().slice(0, CONFIG.MAX_INPUT_LENGTH);
}

// Main 

async function main() {
  validateEnvironment();

  console.log("__________________________________________");
  console.log("|       Website Builder AI  v1.0.0       |");
  console.log("|  Type your request. 'exit' to quit.    |");
  console.log(`|  Project dir: ${CONFIG.PROJECT_DIR.slice(-24).padStart(24)} |`);
  console.log("|________________________________________|\n");

  auditLog("SESSION_START", `platform=${platform}`);

  const history = [];
  let sessionTurns = 0;

  while (true) {
    const raw = readlinesync.question("You: ");
    const question = sanitizeInput(raw);

    if (question.toLowerCase() === "exit") {
      auditLog("SESSION_END", `turns=${sessionTurns}`);
      console.log("Goodbye.");
      break;
    }

    if (!question) {
      console.log("[!] Empty input ignored.\n");
      continue;
    }

    history.push({ role: "user", parts: [{ text: question }] });

    try {
      sessionTurns = await build(history, sessionTurns);
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.warn(`[RATE LIMIT] ${err.message}\n`);
        history.pop(); // remove the failed user message
      } else {
        console.error(`[ERROR] ${err.message}\n`);
        auditLog("UNCAUGHT", err.message.slice(0, 300));
        history.pop();
      }
    }
  }
}

main();