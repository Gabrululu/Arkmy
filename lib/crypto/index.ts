import { hexToBytes } from "viem"
import type { ConnectedWalletClient } from "@/lib/arkiv/client"

const KEY_DERIVATION_MSG = "arkmy-kek-v1"
const HKDF_SALT = new TextEncoder().encode("arkmy-hkdf-salt-v1")
const HKDF_INFO = new TextEncoder().encode("arkmy-aes-kek")

export type EncryptedEnvelope = {
  wrappedKey: string
  keyIV: string
  iv: string
  ciphertext: string
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return btoa(String.fromCharCode(...u8))
}

function fromBase64(s: string): ArrayBuffer {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer as ArrayBuffer
}

async function importAESKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

// Derives a 256-bit KEK by having the wallet sign a fixed message, then running
// SubtleCrypto HKDF (SHA-256) over the signature. Deterministic: same wallet → same KEK.
export async function deriveKEK(walletClient: ConnectedWalletClient): Promise<CryptoKey> {
  const sig = await walletClient.signMessage({
    account: walletClient.account,
    message: KEY_DERIVATION_MSG,
  })
  const sigBuffer = new Uint8Array(hexToBytes(sig)).buffer as ArrayBuffer
  const ikmKey = await crypto.subtle.importKey("raw", sigBuffer, "HKDF", false, ["deriveBits"])
  const keyBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: HKDF_SALT, info: HKDF_INFO },
    ikmKey,
    256,
  )
  return importAESKey(keyBits)
}

// Envelope-encrypts plaintext:
//   1. Generate a random CEK (content encryption key) per call.
//   2. Encrypt plaintext with CEK via AES-GCM.
//   3. Encrypt the raw CEK bytes with the wallet-derived KEK via AES-GCM (the "envelope").
// The on-chain payload stores {wrappedKey, keyIV, iv, ciphertext} — all base64.
export async function encryptEnvelope(
  walletClient: ConnectedWalletClient,
  plaintext: string,
): Promise<EncryptedEnvelope> {
  const kek = await deriveKEK(walletClient)

  const cekRaw = crypto.getRandomValues(new Uint8Array(32))
  const cek = await importAESKey(cekRaw.buffer as ArrayBuffer)

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cek,
    new TextEncoder().encode(plaintext),
  )

  const keyIV = crypto.getRandomValues(new Uint8Array(12))
  const wrappedKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: keyIV },
    kek,
    cekRaw,
  )

  return {
    wrappedKey: toBase64(wrappedKey),
    keyIV: toBase64(keyIV),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  }
}

// Decrypts an envelope produced by encryptEnvelope. Requires the same wallet (same KEK).
export async function decryptEnvelope(
  walletClient: ConnectedWalletClient,
  envelope: EncryptedEnvelope,
): Promise<string> {
  const kek = await deriveKEK(walletClient)

  const cekRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.keyIV) },
    kek,
    fromBase64(envelope.wrappedKey),
  )
  const cek = await importAESKey(cekRaw)

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.iv) },
    cek,
    fromBase64(envelope.ciphertext),
  )

  return new TextDecoder().decode(plaintext)
}
