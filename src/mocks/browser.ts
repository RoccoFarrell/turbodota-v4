// @ts-nocheck - msw is not installed; these mocks are unused scaffolding
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.browser";

export const worker = setupWorker(...handlers);