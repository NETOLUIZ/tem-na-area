import { ApiError } from "../lib/api-error.js";
import { verifyPassword } from "../lib/passwords.js";

export class AuthService {
  constructor(authRepository, token) {
    this.authRepository = authRepository;
    this.token = token;
  }

  async merchantLogin(login, password) {
    const user = await this.authRepository.findMerchantByLogin(login);
    if (!user || !(await verifyPassword(password, user.senha_hash))) {
      throw new ApiError("Login ou senha invalidos.", 401);
    }
    if (user.status !== "ATIVO") {
      throw new ApiError("Usuario sem acesso liberado.", 403, { status: user.status });
    }

    return {
      token: this.token.encode({
        sub: Number(user.usuario_id),
        role: "merchant",
        store_id: user.loja_id ? Number(user.loja_id) : null,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
      }),
      user: {
        id: Number(user.usuario_id),
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        whatsapp: user.whatsapp
      },
      store: {
        id: user.loja_id ? Number(user.loja_id) : null,
        nome: user.loja_nome,
        slug: user.slug,
        status_loja: user.status_loja,
        modo_operacao: user.modo_operacao
      }
    };
  }

  async adminLogin(login, password) {
    const user = await this.authRepository.findAdminByLogin(login);
    if (!user || !(await verifyPassword(password, user.senha_hash))) {
      throw new ApiError("Login ou senha invalidos.", 401);
    }
    if (user.status !== "ATIVO") {
      throw new ApiError("Administrador sem acesso liberado.", 403, { status: user.status });
    }

    return {
      token: this.token.encode({
        sub: Number(user.usuario_id),
        admin_id: Number(user.administrador_id),
        role: "admin",
        access_level: user.nivel_acesso,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
      }),
      user: {
        id: Number(user.usuario_id),
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
      },
      admin: {
        id: Number(user.administrador_id),
        nivel_acesso: user.nivel_acesso
      }
    };
  }
}
