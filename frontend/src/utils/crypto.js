import forge from 'node-forge';

export const decryptData = (encryptedBase64, privateKeyPem) => {
  try {
    // Check if headers exist, if not, node-forge will definitely fail
    if (!privateKeyPem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
       return "[Error: Missing Key Header]";
    }

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encryptedBytes = forge.util.decode64(encryptedBase64);
    
    const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    
    return decrypted;
  } catch (err) {
    console.error("Forge Error:", err);
    // This is where your "Invalid PEM" error is coming from
    return `[Decryption Error: ${err.message}]`;
  }
};

export const encryptData = (text, publicKeyPem) => {
  try {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(text, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    return forge.util.encode64(encrypted);
  } catch (err) {
    console.error("Encryption Error:", err.message);
    return null;
  }
};
export const generateUserKeys = () => {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, keypair) => {
      if (err) reject(err);
      
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      
      resolve({ publicKeyPem, privateKeyPem });
    });
  });
};
