export function generateRandomString(number = 9) {
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomSize = characters.length;

  for (let i = 0; i < number; i++) {
    const randomIndex = Math.floor(Math.random() * randomSize);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

export function tryToParseJSON<T>(jsonString: string) {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return jsonString;
  }
}