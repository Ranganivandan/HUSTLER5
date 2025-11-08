/**
 * Generate a secure random password
 * Format: Uppercase + Lowercase + Numbers + Special chars
 * Example: Zk8@mP2#qR
 */
export function generatePassword(length: number = 10): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%&*!';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a memorable password (easier to type)
 * Format: Word-Number-Word
 * Example: Tiger-2024-Cloud
 */
export function generateMemorablePassword(): string {
  const words = [
    'Tiger', 'Eagle', 'Lion', 'Bear', 'Wolf', 'Hawk', 'Fox', 'Panda',
    'Cloud', 'Storm', 'River', 'Ocean', 'Mountain', 'Forest', 'Valley',
    'Swift', 'Bright', 'Strong', 'Quick', 'Bold', 'Brave', 'Smart'
  ];
  
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  
  return `${word1}${number}${word2}`;
}
