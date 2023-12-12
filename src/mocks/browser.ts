import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.browser";

export const worker = setupWorker(...handlers);