import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { insightsRouter } from "./routers/insights";
import { productsRouter } from "./routers/products";
import { salesRouter } from "./routers/sales";
import { settingsRouter } from "./routers/settings";
import { stockRouter } from "./routers/stock";
import { suppliersRouter } from "./routers/suppliers";
import { usersRouter } from "./routers/users";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  users: router(usersRouter),
  settings: router(settingsRouter),
  suppliers: router(suppliersRouter),
  products: router(productsRouter),
  stock: router(stockRouter),
  sales: router(salesRouter),
  insights: router(insightsRouter),
});

export type AppRouter = typeof appRouter;
