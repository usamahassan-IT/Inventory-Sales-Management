import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";

export const applicationRoles = ["admin", "manager", "staff"] as const;
export type ApplicationRole = (typeof applicationRoles)[number];

export function roleProcedure(allowedRoles: readonly ApplicationRole[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role as ApplicationRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your role does not have permission to perform this action.",
      });
    }

    return next({ ctx });
  });
}

export const managerProcedure = roleProcedure(["admin", "manager"]);
export const salesProcedure = roleProcedure(["admin", "manager", "staff"]);
