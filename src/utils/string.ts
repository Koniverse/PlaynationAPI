export function generateRandomString(prefix = '', number = 6) {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomSize = characters.length;

  for (let i = 0; i < number; i++) {
    const randomIndex = Math.floor(Math.random() * randomSize);
    randomString += characters.charAt(randomIndex);
  }

  return prefix + randomString;
}