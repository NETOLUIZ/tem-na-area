import serverless from "serverless-http";
import { app } from "../../backend/node/src/app.js";
import { ensureDatabase } from "../../backend/node/src/db/bootstrap.js";

let bootstrapped = false;

async function ready() {
  if (!bootstrapped) {
    await ensureDatabase();
    bootstrapped = true;
  }
}

const handler = serverless(app);

export async function handlerProxy(event, context) {
  await ready();
  return handler(event, context);
}

export { handlerProxy as handler };
