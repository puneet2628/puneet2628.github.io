
import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.env.CLOUD_GATE_PASSWORD;

if (!password) {
  console.error("ERROR: CLOUD_GATE_PASSWORD is not set.");
  console.error('CMD: set "CLOUD_GATE_PASSWORD=your-password"');
  process.exit(1);
}

if (password.length < 16) {
  console.error("ERROR: Use a password of at least 16 characters.");
  process.exit(1);
}

const salt = randomBytes(32);
const iterations = 600000;
const keyLength = 32;
const digest = "sha256";

const hash = pbkdf2Sync(
  password,
  salt,
  iterations,
  keyLength,
  digest
);

console.log("\n========== CLOUD GATE CREDENTIALS ==========\n");
console.log("ACCESS_SALT_B64:");
console.log(salt.toString("base64"));

console.log("\nACCESS_HASH_B64:");
console.log(hash.toString("base64"));

console.log("\nPBKDF2_ITERATIONS:");
console.log(iterations);

console.log("\n============================================");
console.log("Copy these values into CloudGate.tsx.");
console.log("Never publish your actual password.");
