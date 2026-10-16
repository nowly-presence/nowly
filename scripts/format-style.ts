import {
  doc,
  type Options,
  type Parser,
  type ParserOptions,
  type Plugin,
} from "prettier";
import { printers } from "prettier/plugins/estree";
import { parsers } from "prettier/plugins/typescript";

type SyntaxNode = {
  type: string;
  [key: string]: unknown;
};

const { group, indent, join, softline } = doc.builders;
const COMPLEX_TERNARY_MAX_LENGTH = 100;
type Doc = doc.builders.Doc;

export const projectFormattingOptions: Options = {
  printWidth: 160,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "none",
  objectWrap: "collapse",
};

const isNode = (value: unknown): value is SyntaxNode =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  typeof value.type === "string";

const nodes = (value: unknown): SyntaxNode[] =>
  Array.isArray(value) ? value.filter(isNode) : [];

const isShorthandObject = (node: SyntaxNode): boolean =>
  nodes(node.properties).every(
    (property) =>
      (property.type === "Property" && property.shorthand === true) ||
      property.type === "SpreadElement",
  );

const isComplexValue = (node: SyntaxNode): boolean =>
  [
    "CallExpression",
    "NewExpression",
    "AwaitExpression",
    "ObjectExpression",
    "ArrayExpression",
  ].includes(node.type);

const shouldExpandObject = (
  node: SyntaxNode,
  parent: SyntaxNode | null,
): boolean => {
  const properties = nodes(node.properties);
  if (
    properties.length === 0 ||
    isShorthandObject(node) ||
    parent?.type === "ConditionalExpression"
  )
    return false;
  return (
    parent?.type === "ReturnStatement" ||
    properties.length > 1 ||
    properties.some(
      (property) =>
        isNode(property.value) &&
        [
          "ObjectExpression",
          "ArrayExpression",
          "ArrowFunctionExpression",
        ].includes(property.value.type),
    )
  );
};

const breakOuterGroup = (value: Doc): Doc => {
  if (Array.isArray(value)) {
    const index = value.findIndex(
      (part) =>
        typeof part === "object" &&
        !Array.isArray(part) &&
        part.type === "group",
    );
    if (index !== -1)
      return value.map((part, partIndex) =>
        partIndex === index ? breakOuterGroup(part) : part,
      );
  } else if (typeof value === "object" && value.type === "group") {
    return { ...value, break: true };
  }
  return value;
};

const expandReturnedJsx = (value: Doc): Doc => {
  if (
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.type !== "group" ||
    !Array.isArray(value.contents)
  )
    return breakOuterGroup(value);

  return {
    ...value,
    break: true,
    contents: value.contents.map((part) => {
      if (
        typeof part !== "object" ||
        Array.isArray(part) ||
        part.type !== "indent" ||
        !Array.isArray(part.contents)
      )
        return part;
      return {
        ...part,
        contents: part.contents.map((body) => {
          if (
            typeof body === "object" &&
            !Array.isArray(body) &&
            body.type === "group" &&
            body.expandedStates?.length
          ) {
            return body.expandedStates[body.expandedStates.length - 1];
          }
          return body;
        }),
      };
    }),
  };
};

const declarationKind = (node: SyntaxNode): string => {
  if (isNode(node.declaration)) return declarationKind(node.declaration);
  if (node.type === "VariableDeclaration") {
    return nodes(node.declarations).some(
      (declaration) =>
        isNode(declaration.init) &&
        ["ArrowFunctionExpression", "FunctionExpression"].includes(
          declaration.init.type,
        ),
    )
      ? "function"
      : "variable";
  }
  if (["TSTypeAliasDeclaration", "TSInterfaceDeclaration"].includes(node.type))
    return "type";
  return node.type;
};

const isControlFlow = (node: SyntaxNode): boolean =>
  [
    "IfStatement",
    "TryStatement",
    "ForStatement",
    "ForOfStatement",
    "ForInStatement",
    "WhileStatement",
    "DoWhileStatement",
    "SwitchStatement",
  ].includes(node.type);

const isGuard = (node: SyntaxNode): boolean => {
  if (node.type !== "IfStatement" || node.alternate || !isNode(node.consequent))
    return false;
  const consequent = node.consequent;
  const body = nodes(consequent.body);
  return (
    [
      "ReturnStatement",
      "ThrowStatement",
      "BreakStatement",
      "ContinueStatement",
    ].includes(consequent.type) ||
    (body.length > 0 &&
      [
        "ReturnStatement",
        "ThrowStatement",
        "BreakStatement",
        "ContinueStatement",
      ].includes(body.at(-1)?.type ?? ""))
  );
};

const isCollectionDeclaration = (node: SyntaxNode): boolean =>
  node.type === "VariableDeclaration" &&
  nodes(node.declarations).some(
    (declaration) =>
      isNode(declaration.init) &&
      declaration.init.type === "CallExpression" &&
      isNode(declaration.init.callee) &&
      isNode(declaration.init.callee.property) &&
      ["filter", "map", "flatMap"].includes(
        String(declaration.init.callee.property.name),
      ),
  );

const isExpandedControlFlow = (node: SyntaxNode): boolean =>
  isControlFlow(node) &&
  (node.type !== "IfStatement" ||
    (isNode(node.consequent) && node.consequent.type === "BlockStatement") ||
    isGuard(node));

const shouldSeparate = (
  previous: SyntaxNode,
  next: SyntaxNode,
  topLevel: boolean,
): boolean => {
  if (topLevel) {
    const previousKind = declarationKind(previous);
    const nextKind = declarationKind(next);
    return previousKind !== nextKind || previousKind === "function";
  }
  if (isGuard(previous) && isGuard(next)) return false;
  if (
    previous.type === "IfStatement" &&
    next.type === "IfStatement" &&
    !isExpandedControlFlow(previous) &&
    isGuard(next)
  )
    return false;
  if (
    next.type === "VariableDeclaration" &&
    !isCollectionDeclaration(next) &&
    (isCollectionDeclaration(previous) ||
      (previous.type === "VariableDeclaration" &&
        nodes(previous.declarations).some(
          (declaration) =>
            isNode(declaration.init) &&
            declaration.init.type === "AwaitExpression",
        )))
  )
    return true;
  return isExpandedControlFlow(previous) || isExpandedControlFlow(next);
};

const addStatementSpacing = async (
  text: string,
  options: ParserOptions<SyntaxNode>,
  parse: Parser<SyntaxNode>["parse"],
): Promise<string> => {
  const ast = await parse(text, options);
  const comments = nodes(ast.comments);
  if (
    comments.some(
      (comment) =>
        typeof comment.value === "string" &&
        comment.value.trim() === "prettier-ignore",
    )
  )
    return text;

  const insertions = new Set<number>();
  const visit = (node: SyntaxNode): void => {
    if (
      ["Program", "BlockStatement", "TSModuleBlock", "SwitchCase"].includes(
        node.type,
      )
    ) {
      const statements = nodes(
        node.type === "SwitchCase" ? node.consequent : node.body,
      );
      for (let index = 1; index < statements.length; index += 1) {
        const previous = statements[index - 1];
        const next = statements[index];
        if (!shouldSeparate(previous, next, node.type === "Program")) continue;
        const start = options.locEnd(previous);
        const end = options.locStart(next);
        const gap = text.slice(start, end);
        if (/^;?\s*$/u.test(gap) && !/\r?\n[\t ]*\r?\n/u.test(gap))
          insertions.add(end);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["comments", "tokens", "loc", "range"].includes(key)) continue;
      if (isNode(value)) visit(value);
      else if (Array.isArray(value)) value.filter(isNode).forEach(visit);
    }
  };
  visit(ast);

  let result = text;
  for (const position of [...insertions].sort((left, right) => right - left)) {
    result = `${result.slice(0, position)}\n\n${result.slice(position)}`;
  }
  return result;
};

export const createProjectStylePlugin = (
  plugins: Plugin[] = [],
): Plugin<SyntaxNode> => {
  const baseParser = plugins.reduce(
    (parser, plugin) => plugin.parsers?.typescript ?? parser,
    parsers.typescript,
  );
  const basePrinter = plugins.reduce(
    (printer, plugin) => plugin.printers?.estree ?? printer,
    printers.estree,
  );
  if (baseParser.astFormat !== "estree") return {};
  return {
    parsers: {
      typescript: {
        ...baseParser,
        preprocess: async (text, options) =>
          addStatementSpacing(
            baseParser.preprocess
              ? await baseParser.preprocess(text, options)
              : text,
            options,
            baseParser.parse,
          ),
      },
    },
    printers: {
      estree: {
        ...basePrinter,
        print: (path, options, print, args) => {
          const node = path.node;
          const parent = path.parent;
          const printNodes = (key: string): Doc[] =>
            nodes(node[key]).map((_, index) => print([key, index]));
          const result = basePrinter.print(path, options, print, args);

          if (node.type === "ImportDeclaration")
            return doc.utils.removeLines(result);
          if (
            ["JSXElement", "JSXFragment"].includes(node.type) &&
            parent?.type === "ReturnStatement" &&
            nodes(node.children).length > 0
          )
            return expandReturnedJsx(result);
          if (
            node.type === "ObjectPattern" &&
            parent?.type === "ArrowFunctionExpression" &&
            !node.comments &&
            !nodes(node.properties).some((property) => property.comments)
          ) {
            return [
              "{",
              nodes(node.properties).length
                ? [" ", join(", ", printNodes("properties")), " "]
                : "",
              "}",
              node.optional ? "?" : "",
              node.typeAnnotation ? print("typeAnnotation") : "",
            ];
          }
          if (node.type === "TSTypeLiteral" && nodes(node.members).length > 0)
            return breakOuterGroup(result);
          if (
            node.type === "TSUnionType" &&
            parent?.type === "TSTypeAliasDeclaration" &&
            nodes(node.types).every((type) => type.type === "TSTypeLiteral") &&
            !node.comments
          ) {
            return join(" | ", printNodes("types"));
          }
          if (
            node.type === "TSTypeAliasDeclaration" &&
            isNode(node.typeAnnotation) &&
            node.typeAnnotation.type === "TSUnionType" &&
            nodes(node.typeAnnotation.types).every(
              (type) => type.type === "TSTypeLiteral",
            ) &&
            !node.comments &&
            !node.typeAnnotation.comments
          ) {
            return [
              node.declare ? "declare " : "",
              "type ",
              print("id"),
              node.typeParameters ? print("typeParameters") : "",
              " = ",
              print("typeAnnotation"),
              options.semi ? ";" : "",
            ];
          }
          if (
            node.type === "ObjectExpression" &&
            shouldExpandObject(node, parent)
          )
            return breakOuterGroup(result);
          if (
            node.type === "ArrayExpression" &&
            nodes(node.elements).length > 1 &&
            nodes(node.elements).some(isComplexValue)
          ) {
            return breakOuterGroup(result);
          }
          if (
            node.type === "IfStatement" &&
            !node.alternate &&
            isNode(node.consequent) &&
            node.consequent.type !== "BlockStatement" &&
            !node.comments &&
            !node.consequent.comments
          ) {
            return group([
              "if (",
              group([indent([softline, print("test")]), softline]),
              ") ",
              print("consequent"),
            ]);
          }
          if (
            node.type === "ArrowFunctionExpression" &&
            isNode(node.body) &&
            node.body.type === "BlockStatement" &&
            typeof result === "object" &&
            !Array.isArray(result) &&
            result.type === "group" &&
            Array.isArray(result.contents) &&
            result.contents[1] === " =>" &&
            !node.comments &&
            !nodes(node.params).some((parameter) => parameter.comments)
          ) {
            const signature = [
              node.async ? "async " : "",
              node.typeParameters ? print("typeParameters") : "",
              "(",
              join(", ", printNodes("params")),
              ")",
              node.returnType ? print("returnType") : "",
            ];
            return {
              ...result,
              contents: [signature, ...result.contents.slice(1)],
            };
          }
          if (
            node.type === "CallExpression" &&
            isNode(node.callee) &&
            node.callee.type === "Identifier" &&
            [
              "useCallback",
              "useMemo",
              "useEffect",
              "useLayoutEffect",
              "useInsertionEffect",
            ].includes(String(node.callee.name))
          ) {
            const argumentsList = nodes(node.arguments);
            if (
              argumentsList.length === 2 &&
              argumentsList[0].type === "ArrowFunctionExpression" &&
              argumentsList[1].type === "ArrayExpression" &&
              !nodes(argumentsList[1].elements).some(isComplexValue) &&
              !node.comments &&
              !argumentsList.some((argument) => argument.comments)
            ) {
              return [
                print("callee"),
                node.optional ? "?." : "",
                node.typeArguments ? print("typeArguments") : "",
                "(",
                join(", ", printNodes("arguments")),
                ")",
              ];
            }
          }
          if (
            node.type === "ConditionalExpression" &&
            isNode(node.consequent) &&
            isNode(node.alternate) &&
            node.consequent.type === "CallExpression" &&
            node.alternate.type === "CallExpression" &&
            options.locEnd(node) - options.locStart(node) >
              COMPLEX_TERNARY_MAX_LENGTH
          ) {
            return breakOuterGroup(result);
          }
          return result;
        },
      },
    },
  };
};

export const projectStylePlugin = createProjectStylePlugin();
