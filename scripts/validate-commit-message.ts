import { readFileSync } from "node:fs";

const messageFile = process.argv[2];

if (!messageFile) {
  console.error("Usage: node scripts/validate-commit-message.ts <commit-message-file>");
  process.exit(2);
}

const message = readFileSync(messageFile, "utf8");
const subject = message.split(/\r?\n/, 1)[0];
const conventionalCommit = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9-]*\))?: .+$/;

if (!conventionalCommit.test(subject)) {
  console.error(`Invalid commit message: "${subject}"`);
  console.error("Expected: type(scope): description, for example: fix(web): remove pause control");
  process.exit(1);
}
