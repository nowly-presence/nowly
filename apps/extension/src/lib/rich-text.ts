export type RichStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type RichSegment = RichStyle & {
  text: string;
};

const PLAIN_STYLE: RichStyle = {
  bold: false,
  italic: false,
  underline: false
};

const MARKERS = [
  {
    token: "**",
    key: "bold"
  },
  {
    token: "__",
    key: "underline"
  },
  {
    token: "*",
    key: "italic"
  }
] as const;

const findClose = (text: string, token: string, from: number): number => {
  let index = text.indexOf(token, from);

  while (index !== -1 && token.length === 1 && (text[index - 1] === token || text[index + 1] === token)) {
    index = text.indexOf(token, index + 1);
  }

  while (index !== -1 && token.length > 1 && text[index + token.length] === token[0]) index += 1;

  return index;
};

const parseWithStyle = (text: string, style: RichStyle): RichSegment[] => {
  const segments: RichSegment[] = [];
  let literal = "";
  let index = 0;

  const flush = () => {
    if (literal) segments.push({
      ...style,
      text: literal
    });
    literal = "";
  };

  while (index < text.length) {
    const marker = MARKERS.find(({ token }) => text.startsWith(token, index));
    const close = marker ? findClose(text, marker.token, index + marker.token.length + 1) : -1;

    if (marker && close !== -1) {
      flush();
      const inner = text.slice(index + marker.token.length, close);
      segments.push(
        ...parseWithStyle(inner, {
          ...style,
          [marker.key]: true
        })
      );
      index = close + marker.token.length;
      continue;
    }

    literal += text[index];
    index += 1;
  }

  flush();
  return segments;
};

export const parseRichText = (text: string): RichSegment[] => parseWithStyle(text, PLAIN_STYLE);

export const richTextToPlain = (segments: readonly RichSegment[]): string => segments.map((segment) => segment.text).join("");