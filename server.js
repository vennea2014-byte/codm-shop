const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

function requireAdmin(req, res, next) {
  if (req.session.admin) {
    return next();
  }

  res.status(401).json({ error: "Unauthorized" });
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price BIGINT NOT NULL,
      image TEXT DEFAULT '',
      status TEXT DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT DEFAULT 'CODM SHOP',
      background TEXT DEFAULT ''
    );
  `);

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-me";

  const existing = await pool.query(
    "SELECT id FROM admins WHERE username = $1",
    [username]
  );

  if (existing.rowCount === 0) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO admins (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    );
  }

  await pool.query(`
    INSERT INTO settings (id, site_name, background)
    VALUES (1, 'CODM SHOP', '')
    ON CONFLICT (id) DO NOTHING
  `);
}

/* Admin Login */
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: "نام کاربری یا رمز عبور اشتباه است"
      });
    }

    const admin = result.rows[0];

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({
        error: "نام کاربری یا رمز عبور اشتباه است"
      });
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username
    };

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Admin Logout */
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/* Check Admin Session */
app.get("/api/admin/me", (req, res) => {
  res.json({
    loggedIn: !!req.session.admin,
    admin: req.session.admin || null
  });
});

/* Register User */
app.post("/api/register", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email
    } = req.body;

    if (!first_name || !last_name || !phone || !email) {
      return res.status(400).json({
        error: "همه فیلدها الزامی هستند"
      });
    }

    await pool.query(
      `
      INSERT INTO users
      (first_name, last_name, phone, email)
      VALUES ($1, $2, $3, $4)
      `,
      [first_name, last_name, phone, email]
    );

    res.json({
      success: true,
      message: "اطلاعات شما ثبت شد"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Get Users - Admin */
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Get Accounts */
app.get("/api/accounts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM accounts ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Add Account */
app.post("/api/admin/accounts", requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      image,
      status
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO accounts
      (title, description, price, image, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        title,
        description || "",
        price,
        image || "",
        status || "available"
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Edit Account */
app.put("/api/admin/accounts/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      price,
      image,
      status
    } = req.body;

    const result = await pool.query(
      `
      UPDATE accounts
      SET
        title = $1,
        description = $2,
        price = $3,
        image = $4,
        status = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        title,
        description || "",
        price,
        image || "",
        status || "available",
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Delete Account */
app.delete("/api/admin/accounts/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM accounts WHERE id = $1",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Get Settings */
app.get("/api/settings", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM settings WHERE id = 1"
    );

    res.json(
      result.rows[0] || {
        site_name: "CODM SHOP",
        background: ""
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Update Settings */
app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const {
      site_name,
      background
    } = req.body;

    const result = await pool.query(
      `
      UPDATE settings
      SET site_name = $1,
          background = $2
      WHERE id = 1
      RETURNING *
      `,
      [
        site_name || "CODM SHOP",
        background || ""
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Static Website */
app.use(express.static(path.join(__dirname, "public")));

/* Start Server */
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`CODM SHOP running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

startServer();
