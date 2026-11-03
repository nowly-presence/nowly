import { serverEnv } from "@nowly/env/server";
import { createSign } from "node:crypto";
import { z } from "zod";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const CLOCK_SKEW_S = 60;
const JWT_LIFETIME_S = 540;
const MS_PER_S = 1_000;
const NO_CONTENT = 204;

const TokenSchema = z.object({ token: z.string() });

export class GithubError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type GithubClient = (method: string, path: string, body?: unknown) => Promise<unknown>;

export const hasGithubApp = (): boolean => Boolean(serverEnv.NOLO_APP_ID && serverEnv.NOLO_PRIVATE_KEY && serverEnv.NOLO_INSTALLATION_ID);

const base64Url = (value: string | Buffer): string => Buffer.from(value).toString("base64url");

const appJwt = (): string => {
  const now = Math.floor(Date.now() / MS_PER_S);
  const header = base64Url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT"
    })
  );
  const payload = base64Url(
    JSON.stringify({
      iat: now - CLOCK_SKEW_S,
      exp: now + JWT_LIFETIME_S,
      iss: serverEnv.NOLO_APP_ID
    })
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign((serverEnv.NOLO_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"));
  return `${header}.${payload}.${base64Url(signature)}`;
};

const call = async (token: string, method: string, path: string, body?: unknown): Promise<unknown> => {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "nolo-bot",
      "X-GitHub-Api-Version": API_VERSION,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  if (!response.ok) throw new GithubError(response.status, `GitHub ${method} ${path} answered ${response.status}`);

  return response.status === NO_CONTENT ? null : response.json();
};

export const githubInstallationClient = async (): Promise<GithubClient> => {
  const { token } = TokenSchema.parse(await call(appJwt(), "POST", `/app/installations/${serverEnv.NOLO_INSTALLATION_ID}/access_tokens`));
  return (method, path, body) => call(token, method, path, body);
};