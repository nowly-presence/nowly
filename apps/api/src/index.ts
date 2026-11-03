import { createApp } from "@/app";
import { serve } from "@hono/node-server";
import { serverEnv } from "@nowly/env/server";

const HOST = "0.0.0.0";

serve(
  {
    fetch: createApp({ logRequests: true }).fetch,
    port: serverEnv.PORT,
    hostname: HOST
  },
  (info) => {
    console.log(`API running on port ${info.port}`);
  }
);