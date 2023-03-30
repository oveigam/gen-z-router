import { z } from "zod";
import GenZRouter from "../../config/GenZRouter";
import { db } from "../../config/mock";
import { powerRangerSchema } from "./power-ranger.validation";

export const powerRangerRouter = new GenZRouter({ name: "Power Ranger", basePath: "/power-ranger" });

export const getAllHandler = powerRangerRouter.get(
  "/",
  {
    query: z.object({ name: z.string().optional(), seasons: z.number().array().optional() }),
    response: powerRangerSchema.array(),
  },
  async ({ query }) => {
    const { name, seasons } = query;
    console.log(seasons);

    const data = name ? await db.search(name) : await db.findAll();
    return data;
  }
);

export const getOneHandler = powerRangerRouter.get(
  "/:id",
  {
    params: z.object({ id: z.number() }),
    response: powerRangerSchema,
  },
  async ({ params }) => {
    const { id } = params;

    const pr = await db.findById(id);
    if (!pr) {
      throw new Error("not found");
    }

    return pr;
  }
);
