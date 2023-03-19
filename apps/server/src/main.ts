import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { generateDocs } from "./config/docs";
import { powerRangerController } from "./modules/power-ranger/power-ranger.routes";

const app = express();

app.use(cors(), express.json(), express.urlencoded({ extended: true }));

app.use(powerRangerController.options.basePath, powerRangerController.router);

const docs = generateDocs();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(docs));
app.get("/api-spec.json", (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(docs);
});

app.listen(8000, () => {
  console.log("💎 Kneel before zod!! 💎");
});
