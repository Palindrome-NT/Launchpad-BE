export function generateOtp(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

export function getOtpExpiry(minutes: number = 5): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
}

export function isOtpExpired(otpExpiresAt: Date): boolean {
  return new Date() > otpExpiresAt;
}
