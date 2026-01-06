import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld, ask } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        helloWorld,
        ask, // AI planner generation function
    ],
});