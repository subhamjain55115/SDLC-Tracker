import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!uri || !email || !password) {
  console.error(
    "Usage: set MONGODB_URI (in .env.local) and pass ADMIN_EMAIL / ADMIN_PASSWORD env vars:\n" +
      '  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npm run seed'
  );
  process.exit(1);
}

await mongoose.connect(uri);

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    { email: String, passwordHash: String },
    { timestamps: true }
  )
);

const existing = await User.countDocuments();
if (existing > 0) {
  console.log("A user already exists — registration is closed. To reset the password, delete the user document in MongoDB first.");
} else {
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email: email.toLowerCase(), passwordHash });
  console.log(`Admin user created: ${email}`);
}

await mongoose.disconnect();
