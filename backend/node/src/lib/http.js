export function sendData(res, data, statusCode = 200) {
  res.status(statusCode).json({ ok: true, data });
}

export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    error: {
      message: error.message || "Erro interno do servidor.",
      details: error.details || undefined
    }
  });
}
