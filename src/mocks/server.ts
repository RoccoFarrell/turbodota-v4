import { setupServer } from "msw/node";
import { http } from "msw";

const handlers = [
  http.get("*/api/randomNumber", ({ request }) => {
   console.log(request)
  })
];

export const server = setupServer(...handlers);