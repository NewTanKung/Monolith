import fs from "node:fs";
import crypto from "node:crypto";

const destinations = [".env", "apps/hub/.env.local"];

if (destinations.some((p) => fs.existsSync(p))) {
  console.log(
    "Environment files already exist. Keep them in sync using the .env.example files.",
  );
  process.exit(0);
}

const jwt = crypto.randomBytes(48).toString("base64url");
const token = crypto.randomBytes(48).toString("base64url");
const shared =
  "MONOLITH_JWT_SECRET=" + jwt + "\nHUB_URL=http://localhost:3000\n";

fs.writeFileSync(
  ".env",
  'DATABASE_URL="postgresql://monolith:monolith_local_dev@localhost:55432/monolith"\n',
);

fs.writeFileSync(
  "apps/hub/.env.local",
  fs.readFileSync(".env") +
    shared +
    'SESSION_COOKIE_DOMAIN=\nALLOW_REGISTRATION=true\nMONOLITH_SERVICE_TOKENS=\'{"External Service":"' +
    token +
    "\"}'\n",
);

console.log(
  "Created local environment files with random signing and service credentials.",
);
