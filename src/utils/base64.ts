/**
 * Base64 encoding utility that supports UTF-8 characters
 * Handles Arabic text and other Unicode characters properly
 */

export function toBase64Utf8(input: string): string {
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(input, 'utf8').toString('base64');
  }

  // Use TextEncoder in modern browsers for proper UTF-8 handling
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  try {
    return btoa(binary);
  } catch (error) {
    console.error('Base64 encoding error:', error);
    throw new Error('Failed to encode UTF-8 string to Base64');
  }
}

/**
 * Decode Base64 string back to UTF-8
 */
export function fromBase64Utf8(base64String: string): string {
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(base64String, 'base64').toString('utf8');
  }

  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    console.error('Base64 decoding error:', error);
    throw new Error('Failed to decode Base64 string to UTF-8');
  }
}
