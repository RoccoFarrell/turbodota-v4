import { browser, dev } from "$app/environment";

/**
 * Lazy-inject the MSW handler
 * so that no errors happen during
 * build/runtime due to invalid
 * imports from server/client.
 */
export async function inject() {
  if (dev && browser) {
    const { worker } = await import("./browser");
    // For live development, I disabled all warnings
    // for requests that are not mocked. Change how
    // you think it best fits your project.
    return worker.start({ onUnhandledRequest: "bypass" }).catch(console.warn);
  }
  if (dev && !browser) {
    const { server } = await import("./server");
    // Same as in worker-mock above.
    console.log(`[msw] - initiatlized on server`)
    return server.listen({ onUnhandledRequest: "bypass" });
  }
}