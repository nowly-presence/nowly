export type CodeTokenKind = "keyword" | "name" | "string" | "literal" | "plain";

export type CodeToken = {
  kind: CodeTokenKind;
  text: string;
};

export type CodeLanguage = "ts" | "json";

const TOKEN =
  /(\/\/[^\n]*)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+|[^\sA-Za-z_$\d"'`/]+|\/)/g;

const KEYWORDS = new Set(["new", "async", "await", "return", "if", "else", "import", "from", "export", "typeof", "type", "as"]);
const LITERALS = new Set(["true", "false", "null", "undefined"]);
const DECLARATIONS = new Set(["const", "let", "var", "function"]);

const wordKind = (word: string, language: CodeLanguage): CodeTokenKind => {
  if (LITERALS.has(word)) return "literal";
  if (language === "json" || DECLARATIONS.has(word)) return "plain";

  return KEYWORDS.has(word) ? "keyword" : "name";
};

const push = (tokens: CodeToken[], kind: CodeTokenKind, text: string) => {
  const last = tokens.at(-1);
  if (last?.kind === kind) last.text += text;
  else tokens.push({ kind, text });
};

export const highlightCode = (source: string, language: CodeLanguage): CodeToken[] => {
  const tokens: CodeToken[] = [];

  for (const match of source.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = match;
    if (comment) push(tokens, "plain", text);
    else if (string) {
      const isKey = language === "json" && /^\s*:/.test(source.slice((match.index ?? 0) + text.length));
      push(tokens, isKey ? "name" : "string", text);
    } else if (number) push(tokens, "literal", text);
    else if (word) push(tokens, wordKind(word, language), text);
    else push(tokens, "plain", text);
  }

  return tokens;
};

export const codeLanguageOf = (path: string): CodeLanguage => (path.endsWith(".json") ? "json" : "ts");