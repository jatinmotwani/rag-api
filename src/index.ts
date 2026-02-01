import "dotenv/config";
import { config } from "./config";
import { ensureSchema } from "./db/schema";
import { createServer } from "./server";

async function main() {
  await ensureSchema();
  const app = createServer();

  app.listen(config.port, config.host, () => {
    console.log(`API listening on http://${config.host}:${config.port}`);
  });
}

void main();
