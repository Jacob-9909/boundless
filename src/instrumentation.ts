import type { Instrumentation } from "next";
import { reportError } from "@/lib/log";

/** Every uncaught server error: pages, route handlers, server actions, proxy. Request headers (cookies) stay out. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  await reportError(context.routeType, err, {
    path: request.path.split("?")[0],
    method: request.method,
    route: context.routePath,
  });
};
