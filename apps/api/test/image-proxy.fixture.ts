import { presence } from "@nowly/database/schema/presence";
import { createTestDatabase } from "./database";

export const createImageProxyCatalog = async () => {
  const database = await createTestDatabase();
  await database.db.insert(presence).values([
    {
      slug: "tiktok",
      metadata: {
        imageProxy: {
          hostSuffixes: ["tiktokcdn.com", "tiktokcdn-eu.com"],
          headers: { Referer: "https://www.tiktok.com/" }
        }
      }
    },
    {
      slug: "canalplus",
      metadata: {
        imageProxy: {
          hostSuffixes: ["thumb.canalplus.pro"]
        }
      }
    },
    {
      slug: "github",
      metadata: {
        imageProxy: {
          hostSuffixes: ["github.com"]
        }
      }
    }
  ]);
  return database;
};