import { OpenAPIRegistry, OpenAPIGenerator, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const openapi = new OpenAPIRegistry();

export const openapiAuth = openapi.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "username",
});

export const generateDocs = () =>
  new OpenAPIGenerator(openapi.definitions, "3.0.0").generateDocument({
    info: {
      title: "Gen Z Validation",
      description: "Mejor tipado, menos boilerplate.",
      contact: {
        name: "General Zod",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      version: "1.0.0",
    },
  });
