const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your-secret-key";

// Generate token
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: "1h",
  });
}

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Login endpoint
server.post("/api/auth/login", (req, res) => {
  const { email, senha } = req.body;
  const users = router.db.get("users").value();
  const user = users.find((u) => u.email === email && u.senha === senha);

  if (user) {
    const token = generateToken(user);
    const { senha, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } else {
    res.status(401).json({ message: "Email ou senha inválidos" });
  }
});

// Register endpoint
server.post("/api/auth/register", (req, res) => {
  const { nomeDeUsuario, email, senha } = req.body;
  const users = router.db.get("users").value();

  // Check if email already exists
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ message: "Email já cadastrado" });
  }

  // Create new user
  const newUser = {
    id: users.length + 1,
    nomeDeUsuario,
    email,
    senha,
  };

  // Add user to db
  router.db.get("users").push(newUser).write();

  // Generate token and return user data
  const token = generateToken(newUser);
  const { senha: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ token, user: userWithoutPassword });
});

// Protect other endpoints
server.use(/^(?!\/api\/auth).*$/, (req, res, next) => {
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    return res.status(401).json({ message: "Error in authorization format" });
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    const verifiedToken = jwt.verify(token, SECRET_KEY);
    if (verifiedToken) {
      req.user = verifiedToken;
      next();
    }
  } catch (error) {
    res.status(401).json({ message: "Access token not valid" });
  }
});

server.use("/api", router);

// Start server
const port = 3000;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
