# CloudPath Academy — Private Cloud Access

A password-protected demonstration gateway for the CloudPath Academy dashboard.

This guide explains how to generate your password verifier on Windows, macOS, and Linux.

## 1. Requirements

- Node.js 20+
- npm
- A terminal or command prompt
- `generate-cloud-gate-hash.mjs` in the project root

Check your Node.js installation:

```bash
node --version
npm --version
```

## 2. Generate Your Password Hash

CloudGate uses Node.js cryptography to derive a password verifier using:

| Setting | Value |
|---|---|
| Algorithm | PBKDF2 |
| Digest | SHA-256 |
| Iterations | 600,000 |
| Salt length | 32 bytes |
| Derived key length | 32 bytes |
| Output encoding | Base64 |

Your actual password is supplied through an environment variable rather than hardcoded in the generator.

### Windows — Command Prompt (CMD)

Set your password:

```cmd
set "CLOUD_GATE_PASSWORD=YOUR_LONG_UNIQUE_PASSWORD"
```

Generate the credentials:

```cmd
node generate-cloud-gate-hash.mjs
```

### Windows — PowerShell

Set your password:

```powershell
$env:CLOUD_GATE_PASSWORD = "YOUR_LONG_UNIQUE_PASSWORD"
```

Generate the credentials:

```powershell
node .\generate-cloud-gate-hash.mjs
```

### macOS — Terminal (Zsh / Bash)

Set your password:

```bash
export CLOUD_GATE_PASSWORD='YOUR_LONG_UNIQUE_PASSWORD'
```

Generate the credentials:

```bash
node ./generate-cloud-gate-hash.mjs
```

### Linux — Bash / Zsh

Set your password:

```bash
export CLOUD_GATE_PASSWORD='YOUR_LONG_UNIQUE_PASSWORD'
```

Generate the credentials:

```bash
node ./generate-cloud-gate-hash.mjs
```

### Linux — Fish Shell

Set your password:

```fish
set -gx CLOUD_GATE_PASSWORD 'YOUR_LONG_UNIQUE_PASSWORD'
```

Generate the credentials:

```fish
node ./generate-cloud-gate-hash.mjs
```

### One-command alternatives

For temporary use without exporting the variable:

**macOS / Linux — Bash or Zsh**

```bash
CLOUD_GATE_PASSWORD='YOUR_LONG_UNIQUE_PASSWORD' node generate-cloud-gate-hash.mjs
```

**Windows PowerShell**

```powershell
$env:CLOUD_GATE_PASSWORD = "YOUR_LONG_UNIQUE_PASSWORD"; node .\generate-cloud-gate-hash.mjs
```

**Windows CMD**

```cmd
set "CLOUD_GATE_PASSWORD=YOUR_LONG_UNIQUE_PASSWORD" 
```

```cmd
node generate-cloud-gate-hash.mjs
```

## 3. Generated Credentials

The generator prints three values:

```text
ACCESS_SALT_B64:
<generated-salt>

ACCESS_HASH_B64:
<generated-hash>

PBKDF2_ITERATIONS:
600000
```

Copy the generated values into your CloudGate configuration.

Keep the generated salt and hash private where practical.

## 4. Configure CloudGate.tsx

Open your CloudGate component and update the configuration:

```typescript
const ACCESS_SALT_B64 = "YOUR_GENERATED_SALT";
const ACCESS_HASH_B64 = "YOUR_GENERATED_HASH";
const PBKDF2_ITERATIONS = 600000;
```

The browser-side verifier must use exactly the same cryptographic settings:

- PBKDF2
- SHA-256
- 600,000 iterations
- 32-byte derived key
- Base64-decoded salt and expected hash

A mismatch will cause password verification to fail.

## 5. Start the Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 6. Troubleshooting

### Error: MODULE_NOT_FOUND

Check whether the generator exists in your current project directory:

**Windows CMD:**

```cmd
dir generate-cloud-gate-hash.mjs
```

**PowerShell:**

```powershell
Get-Item .\generate-cloud-gate-hash.mjs
```

**macOS / Linux:**

```bash
ls -l ./generate-cloud-gate-hash.mjs
```

If the file is missing, place it in the project root.

### Error: CLOUD_GATE_PASSWORD is not set

Set the environment variable using the instructions for your terminal and rerun the generator.

### Password verification fails

Check that:

1. The password was entered correctly.
2. The salt was copied completely.
3. The hash was copied completely.
4. Both values are Base64-decoded by the verifier.
5. The iteration count is 600,000.
6. The derived key length is 32 bytes.
7. The digest is SHA-256.

## 7. Security Considerations

**Important: CloudGate is a client-side demonstration gate, not production-grade authentication.**

Because the React application is publicly distributed:

- The verifier can be extracted from the JavaScript bundle.
- Password guesses can be attempted offline.
- Client-side authentication state can be modified.
- Protected frontend code can be downloaded independently of the gate.

PBKDF2 makes password guessing more expensive, but it does not make a public client-side gate secure.

Do not use this implementation to protect confidential information, production credentials, private infrastructure, or sensitive user data.

For genuine access control, enforce authentication and authorization on a trusted server.

## 8. Keep Your Credentials Private

- Never hardcode your actual password into source code.
- Never commit your actual password to Git.
- Never publish generated credentials unnecessarily.
- Use a unique password that is not reused elsewhere.
- Use a password manager.
- Generate a new salt and verifier when changing passwords.

## 9. Project Structure

```text
CloudPath-Academy/
│
├── src/
│   ├── CloudGate.tsx
│   └── CloudApp.tsx
│
├── generate-cloud-gate-hash.mjs
├── package.json
├── package-lock.json
├── index.html
└── README.md
```

## 10. License and Usage

CloudPath Academy is a cloud-learning and engineering portfolio project.

Refer to the repository's license for usage and distribution permissions.

---

**CloudPath Academy**

*Learn. Build. Architect. Engineer the Cloud.*