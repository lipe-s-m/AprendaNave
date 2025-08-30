module.exports = (req, res, next) => {
  if (req.path === "/users" && req.method === "POST") {
    const db = require("./db.json");
    const users = db.users || [];

    // Check if this is a registration request
    if (req.body.nomeDeUsuario) {
      // This is a registration
      if (users.find((user) => user.email === req.body.email)) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }
      // If it's a registration, let it pass through to json-server's default behavior to create a user.
      // We will modify the response later if needed, but for now, the main goal is to let it be created.
      next();
    } else {
      // This is a login attempt
      const user = users.find(
        (u) => u.email === req.body.email && u.senha === req.body.senha
      );

      if (!user) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const token = "mock_token_" + Math.random().toString(36).substr(2);
      res.json({
        token,
        user: { ...user, senha: undefined },
      });
    }
  } else {
    next();
  }
};
