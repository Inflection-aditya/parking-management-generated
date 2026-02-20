import crypto from 'crypto';

export const generateApiKey = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const generateApiSecret = (length: number = 64): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const hashApiSecret = async (secret: string): Promise<string> => {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(secret, 12);
};

export const verifyApiSecret = async (secret: string, hash: string): Promise<boolean> => {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(secret, hash);
};

export const generateOtp = (length: number = 6): string => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
};

export const generateRandomString = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const generateUuid = (): string => {
    return crypto.randomUUID();
};
