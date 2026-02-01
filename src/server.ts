import "dotenv/config";
import { createApp } from "./app";
import { config } from "./config";

function startServer() {
  const app = createApp();
  app.listen(config.port, config.host, () => {
    console.log(`API listening on http://${config.host}:${config.port}`);
  });
}

startServer();
