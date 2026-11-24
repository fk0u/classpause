/** Starts the protocol clock once per Node server process. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSweeper } = await import("./lib/sweeper");
    startSweeper();
  }
}
