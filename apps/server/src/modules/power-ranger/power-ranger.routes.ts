import { z } from "zod";
import Controller from "../../config/Controller";
import { db } from "../../config/mock";
import { powerRangerSchema } from "./power-ranger.validation";

export const powerRangerController = new Controller({ name: "Power Rangers", basePath: "/power-rangers" });

export const getAllHandler = powerRangerController.get(
  "/",
  {
    query: z.object({ name: z.string().optional() }),
    response: powerRangerSchema.array(),
  },
  async ({ query }) => {
    const { name } = query;
    const data = name ? await db.search(name) : await db.findAll();
    return data;
  }
);

export const getOneHandler = powerRangerController.get(
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