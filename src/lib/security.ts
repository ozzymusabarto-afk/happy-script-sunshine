/**
 * Proteção local do AURIN: PIN cifrado (PBKDF2) e biometria via WebAuthn.
 * Nada disso sai do aparelho — só o hash do PIN é guardado, nunca o PIN.
 */

const ITERATIONS = 120_000;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function newSalt() {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPin(pin: string, salt: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromBase64(salt), iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

export async function verifyPin(pin: string, salt: string, expected: string) {
  const got = await hashPin(pin, salt);
  return got === expected;
}

/* ------------------------------- biometria ------------------------------- */

export function biometricsMaybeAvailable() {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function biometricsSupported() {
  if (!biometricsMaybeAvailable()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Registra a digital/Face ID deste aparelho e devolve o id da credencial. */
export async function registerBiometrics(userName: string): Promise<string | null> {
  if (!biometricsMaybeAvailable()) return null;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "AURIN" },
      user: { id: userId, name: userName || "aurin", displayName: userName || "AURIN" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!credential) return null;
  return toBase64(new Uint8Array(credential.rawId));
}

/** Pede a digital/Face ID para desbloquear. */
export async function verifyBiometrics(credentialId: string) {
  if (!biometricsMaybeAvailable()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: fromBase64(credentialId) }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

/** Espera crescente após erros seguidos, sem punir quem só errou uma vez. */
export function cooldownSeconds(attempts: number) {
  if (attempts < 3) return 0;
  if (attempts < 5) return 15;
  if (attempts < 8) return 60;
  return 300;
}
