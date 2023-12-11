//
// app/src/msw/handlers.server.ts
//

import { http } from "msw";
import { values } from "./fixtures/msw-demo";

export const handlers = [
  http.get("/api/randomNumber", ({ request }) => {
   console.log(request)
  })
];