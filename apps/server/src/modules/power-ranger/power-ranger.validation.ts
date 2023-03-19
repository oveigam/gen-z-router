import { z } from "zod";

export const powerRangerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    seasons: z
      .object({
        season: z.enum(["1", "2", "3", "zeo"]),
        color: z.enum(["red", "yellow", "black", "pink", "blue", "green", "white", "gold"]),
      })
      .array(),
  })
  .openapi({ title: "Porwer Ranger", description: "Go Go Power Rangers" });
