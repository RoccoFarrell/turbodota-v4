// @ts-nocheck - msw is not installed; these mocks are unused scaffolding
//
// app/src/msw/handlers.worker.ts
//

import { http, HttpResponse} from "msw";
import { values } from "./fixtures/msw-demo";

// Mock relative URLs that map to your
// routes' data endpoints. This mock only
// happens for client-side requests.
//
// Note that if you use shadow endpoints, this still works
// as the endpoint gets created by SvelteKit.
export const handlers = [
  http.get("/random/*", ({ request }) => {
    console.log(`Got a request: `, request.url)
  })
];