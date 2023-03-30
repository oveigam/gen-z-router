import { NextFunction, Request, Response, Router } from "express";
import {
  AnyZodObject,
  Schema,
  z,
  ZodArrayDef,
  ZodDefaultDef,
  ZodFirstPartyTypeKind,
  ZodOptionalDef,
  ZodTypeAny,
} from "zod";
import { openapi, openapiAuth } from "./docs";

const IS_DEV = true;

function parseStringNumber(param: unknown) {
  return typeof param === "string" ? Number(param) : param;
}

function parseStringBoolean(param: unknown) {
  return param === "true" ? true : param === "false" ? false : param;
}

function preprocess<Def extends { typeName: ZodFirstPartyTypeKind }>(
  key: string,
  params: Record<string, unknown>,
  def: Def
) {
  switch (def.typeName) {
    // Los esquemas que son opcionales o que tienen un default no necesitan nada especial
    // ejecutamos el preproceso de nuevo con el esquema interno
    case ZodFirstPartyTypeKind.ZodDefault:
      const defaDef = def as unknown as ZodDefaultDef;
      preprocess(key, params, defaDef.innerType._def);
      break;
    case ZodFirstPartyTypeKind.ZodOptional:
      if (params[key] !== undefined) {
        const optionalDef = def as unknown as ZodOptionalDef;
        preprocess(key, params, optionalDef.innerType._def);
      }
      break;

    case ZodFirstPartyTypeKind.ZodArray:
      const arrDef = def as unknown as ZodArrayDef;
      const param = params[key];
      if (Array.isArray(param)) {
        // Los arrays se mapean segun el tipo del esquema
        if (arrDef.type._def.typeName === ZodFirstPartyTypeKind.ZodNumber) {
          params[key] = param.map(parseStringNumber);
        } else if (arrDef.type._def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
          params[key] = param.map(parseStringBoolean);
        }
      } else {
        // Si estamos procesando un array que vienen en la query de la consulta hay
        // que tener en cuenta que si solo tiene un elemento no llegará como array
        // si no que llegará como un elemento único
        if (arrDef.type._def.typeName === ZodFirstPartyTypeKind.ZodNumber) {
          params[key] = [parseStringNumber(param)];
        } else if (arrDef.type._def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
          params[key] = [parseStringBoolean(param)];
        }
      }
      preprocess(key, params, arrDef.type._def);
      break;

    case ZodFirstPartyTypeKind.ZodNumber:
      params[key] = parseStringNumber(params[key]);
      break;

    case ZodFirstPartyTypeKind.ZodBoolean:
      params[key] = parseStringBoolean(params[key]);
      break;

    default:
      break;
  }
}

function parseFromPathOrQuery<P extends AnyZodObject>(params: Record<string, unknown>, schema: P) {
  const def = schema._def;

  if (def.typeName === ZodFirstPartyTypeKind.ZodObject) {
    const shape = def.shape() as Record<string, ZodTypeAny>;
    for (const key in shape) {
      preprocess(key, params, shape[key]._def);
    }
  }

  return schema.parse(params);
}

type ValidationSchema<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema> = {
  params?: P;
  query?: Q;
  body?: B;
  response: R;
};

/**
 * Middleware que convierte y valida los datos de param, query y body de una request, si los
 * datos no son correctos se lanza un RequestInputError
 *
 * @param validation   Objeto de validacion de zod.
 *                      Para los params y la query es necesario usar z.preprocess para convertir los datos ya que siempre vienen como string o string[]
 * @returns
 */
function inputMiddleware<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
  validation: ValidationSchema<P, Q, B, R>
) {
  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      const { params: paramsSchema, query: querySchema, body: bodySchema } = validation;
      if (paramsSchema) {
        req.params = parseFromPathOrQuery(req.params, paramsSchema);
      }
      if (querySchema) {
        req.query = parseFromPathOrQuery(req.query, querySchema);
      }
      if (bodySchema) {
        req.body = bodySchema.parse(req.body);
      }
      return next();
    } catch (error) {
      // Customize error if desired
      console.log("------------------");
      next(error);
    }
  };
}

type Input<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject> = {
  params: z.infer<P>;
  query: z.infer<Q>;
  body: z.infer<B>;
};

/**
 *
 * @param controllerFn Funcion que ejecutara el request handler
 * @param statusCode Http status code de respuesta
 * @returns Response a la response con los datos retornados del controllerFn
 */
function createRequestHandler<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
  controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>,
  responseValidator: R,
  statusCode = 200
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as unknown as z.infer<P>;
      const query = req.query as unknown as z.infer<Q>;
      const body = req.body as unknown as z.infer<B>;

      const response = await controllerFn({ params, query, body });
      if (IS_DEV) {
        // No debería ser necesario validar información que nosotros mismo mandamos,
        // pero podemos hacerlo en dev para detectar posibles errores
        const { success } = responseValidator.safeParse(response);
        if (!success) {
          console.warn("VALIDATION ERROR ON RESPONSE!");
        }
      }
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Traduce la nomenclatura de rutas para metrizadas de express a la nomenclatura de swagger
 *
 * Ej: /user/:userId --> /user/{userId}
 *
 * @param basePath ruta base del endpoint
 * @param path path del enpoint
 * @returns path de un endpoint en swagger
 */
function generateSwaggerPath(basePath: string, path: Path | PathOptions) {
  let swaggerPath = basePath + path;
  if (swaggerPath.includes(":")) {
    const subPaths = swaggerPath.split("/");
    swaggerPath = "";
    for (const subPath of subPaths) {
      if (!subPath) continue;
      if (subPath.includes(":")) {
        swaggerPath = swaggerPath.concat("/{").concat(subPath.replace(":", "")).concat("}");
      } else {
        swaggerPath = swaggerPath.concat("/").concat(subPath);
      }
    }
  }
  return swaggerPath;
}

function registerDocs(params: {
  path: Path | PathOptions;
  method: Method;
  validation: ValidationSchema<AnyZodObject, AnyZodObject, AnyZodObject, Schema>;
  responseStatus?: number;
  options: Options;
  operationId: string;
}) {
  const {
    path,
    method,
    validation: { response, ...input },
    responseStatus = 200,
    options,
    operationId,
  } = params;

  // Registro de schemas (solo nos interesan los cuerpos)
  if (input.body) {
    registerSchema(input.body);
  }
  registerSchema(response);

  // Registro de paths
  openapi.registerPath({
    method,
    tags: [options.name],
    path: generateSwaggerPath(options.basePath, path),
    operationId,
    security: [{ [openapiAuth.name]: [] }],
    request: {
      ...input,
      body: input.body
        ? {
            content: {
              "application/json": {
                schema: input.body,
              },
            },
          }
        : undefined,
    },
    responses: {
      [responseStatus]: {
        description: "",
        content: {
          "application/json": {
            schema: response,
          },
        },
      },
      // TODO añadir todas las posibles respuestas de errores (No rights, No auth, etc.)
    },
  });
}

function generateOperationId(params: { path: Path; method: Method; routerName: string }) {
  const { path, method, routerName } = params;
  let operationId = "";

  switch (method) {
    case "get":
      if (path.length > 1) {
        operationId += "getOne";
      } else {
        operationId += "getMany";
      }
      break;
    case "post":
      operationId += "create";
      break;
    case "put":
    case "patch":
      operationId += "update";
      break;
    case "delete":
      operationId += "delete";
      break;
  }

  return operationId + routerName.split(" ").join("");
}

const schemaRegistry = new Map<Schema, boolean>();
function registerSchema(schema: Schema) {
  if (!schemaRegistry.get(schema) && schema._def.openapi) {
    openapi.register("", schema);
  }
}

type Path = Exclude<`/${string}`, `${string}/`>;
type PathOptions = {
  path: Path;
  operationId: string;
};
type Method = "get" | "post" | "put" | "patch" | "delete";

type Options = {
  name: string;
  basePath: Path;
};

class GenZRouter {
  $router: Router;
  options: Options;

  constructor(options: Options) {
    this.$router = Router();
    this.options = options;
  }

  get<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
    path: Path | PathOptions,
    validation: ValidationSchema<P, Q, B, R>,
    controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>
  ) {
    const routePath = typeof path === "string" ? path : path.path;
    const operationId =
      typeof path === "string"
        ? generateOperationId({ path, method: "get", routerName: this.options.name })
        : path.operationId;
    registerDocs({
      method: "get",
      options: this.options,
      path,
      validation,
      operationId,
    });
    this.$router.get(routePath, inputMiddleware(validation), createRequestHandler(controllerFn, validation.response));
    return controllerFn;
  }

  post<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
    path: Path | PathOptions,
    validation: ValidationSchema<P, Q, B, R>,
    controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>
  ) {
    const routePath = typeof path === "string" ? path : path.path;
    const operationId =
      typeof path === "string"
        ? generateOperationId({ path, method: "post", routerName: this.options.name })
        : path.operationId;
    registerDocs({
      path,
      method: "post",
      validation,
      responseStatus: 201,
      options: this.options,
      operationId,
    });
    this.$router.post(
      routePath,
      inputMiddleware(validation),
      createRequestHandler(controllerFn, validation.response, 201)
    );
    return controllerFn;
  }

  put<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
    path: Path | PathOptions,
    validation: ValidationSchema<P, Q, B, R>,
    controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>
  ) {
    const routePath = typeof path === "string" ? path : path.path;
    const operationId =
      typeof path === "string"
        ? generateOperationId({ path, method: "put", routerName: this.options.name })
        : path.operationId;
    registerDocs({
      path,
      method: "put",
      validation,
      options: this.options,
      operationId,
    });
    this.$router.put(routePath, inputMiddleware(validation), createRequestHandler(controllerFn, validation.response));
    return controllerFn;
  }

  patch<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
    path: Path | PathOptions,
    validation: ValidationSchema<P, Q, B, R>,
    controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>
  ) {
    const routePath = typeof path === "string" ? path : path.path;
    const operationId =
      typeof path === "string"
        ? generateOperationId({ path, method: "patch", routerName: this.options.name })
        : path.operationId;
    registerDocs({
      path,
      method: "patch",
      validation,
      options: this.options,
      operationId,
    });
    this.$router.patch(routePath, inputMiddleware(validation), createRequestHandler(controllerFn, validation.response));
    return controllerFn;
  }

  delete<P extends AnyZodObject, Q extends AnyZodObject, B extends AnyZodObject, R extends Schema>(
    path: Path | PathOptions,
    validation: ValidationSchema<P, Q, B, R>,
    controllerFn: (input: Input<P, Q, B>) => Promise<z.infer<R>>
  ) {
    const routePath = typeof path === "string" ? path : path.path;
    const operationId =
      typeof path === "string"
        ? generateOperationId({ path, method: "delete", routerName: this.options.name })
        : path.operationId;
    registerDocs({
      path,
      method: "delete",
      validation,
      options: this.options,
      operationId,
    });
    this.$router.delete(
      routePath,
      inputMiddleware(validation),
      createRequestHandler(controllerFn, validation.response)
    );
    return controllerFn;
  }
}

export default GenZRouter;
