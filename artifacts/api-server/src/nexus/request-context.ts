import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, Response } from "express";

// Keeps each Supabase client tied to its own request and response cookies.
export const requestContext = new AsyncLocalStorage<{ req: Request; res: Response }>();
