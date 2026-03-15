import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureDatabase } from "./db/bootstrap.js";

await ensureDatabase();

app.listen(env.port, () => {
  console.log(`Tem na Area Node API rodando em ${env.appUrl}`);
});
