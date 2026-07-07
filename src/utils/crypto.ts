export async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function encryptPassword(password: string): string {
    const key = "placify_key";
    let result = "";
    for (let i = 0; i < password.length; i++) {
        result += String.fromCharCode(password.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

export function decryptPassword(encrypted: string): string {
    const decoded = atob(encrypted);
    const key = "placify_key";
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}
