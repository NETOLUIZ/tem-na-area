import { ApiError } from "../lib/api-error.js";

export function createAuthMiddleware(token) {
  function readUser(req) {
    const header = req.headers.authorization;
    const match = typeof header === "string" ? header.match(/^Bearer\s+(.+)$/i) : null;
    if (!match) {
      throw new ApiError("Token de acesso nao informado.", 401);
    }

    return token.decode(match[1]);
  }

  return {
    requireRole(...roles) {
      return (req, _res, next) => {
        try {
          const user = readUser(req);
          if (roles.length > 0 && !roles.includes(user.role)) {
            throw new ApiError("Usuario sem permissao para este recurso.", 403);
          }
          req.auth = user;
          next();
        } catch (error) {
          next(error);
        }
      };
    },
    requirePermission(...permissions) {
      return (req, _res, next) => {
        try {
          const user = readUser(req);
          const allowed = Array.isArray(user.permissions) ? user.permissions : [];
          if (permissions.length > 0 && !permissions.every((permission) => allowed.includes(permission))) {
            throw new ApiError("Usuario sem permissao para esta operacao.", 403);
          }
          req.auth = user;
          next();
        } catch (error) {
          next(error);
        }
      };
    }
  };
}
