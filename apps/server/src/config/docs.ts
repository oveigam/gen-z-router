import { OpenAPIRegistry, OpenAPIGenerator, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const openapi = new OpenAPIRegistry();

export const openapiAuth = openapi.registerComponent("securitySchemes", "username", {
  type: "apiKey",
  name: "username",
  description: "All requests must include the `username` header containing the employee code.",
  in: "header",
});

export const generateDocs = () =>
  new OpenAPIGenerator(openapi.definitions, "3.0.0").generateDocument({
    info: {
      title: "Gen Z Validation",
      description: "Kneel before zod",
      contact: {
        name: "General Zod",
      },
      version: "1.0.0",
    },
    externalDocs: {
      description: "Api Spec",
      url: "/api-spec.json",
    },
  });
