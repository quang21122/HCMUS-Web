// config/session.js

import session from "express-session";

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  // For production, use a session store like connect-mongo
});

export default sessionMiddleware;