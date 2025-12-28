import { z } from "zod";

/**
 * Versatile Validator Middleware
 * * Usage 1 (Body only): 
 * validate(createProductSchema)
 * * Usage 2 (Multiple parts): 
 * validate({ body: createProductSchema, params: productIdSchema, query: filterSchema })
 */
export const validate = (schemaOrSelector) => async (req, res, next) => {
  try {
    // 1. Normalize input: If a raw Zod schema is passed, assume it's for 'body'.
    // Otherwise, assume it's an object { body, query, params }.
    let schemas = {};
    
    // Check if it's a Zod schema (duck typing: checks for .parse method)
    if (typeof schemaOrSelector.parse === "function") {
      schemas = { body: schemaOrSelector };
    } else {
      schemas = schemaOrSelector;
    }

    // 2. Validate URL Parameters (e.g., /products/:id)
    if (schemas.params) {
      // parseAsync allows for async refinements in Zod if needed later
      req.params = await schemas.params.parseAsync(req.params);
    }

    // 3. Validate Query Strings (e.g., ?limit=10&page=1)
    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }

    // 4. Validate Request Body (JSON payload)
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return a clean, formatted error response
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: error
      });
    }
    // Pass unexpected errors to the global error handler
    next(error);
  }
};