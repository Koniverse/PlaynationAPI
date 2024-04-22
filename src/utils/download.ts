import * as fs from 'fs';

export async function downloadImage(url:string, fileName:string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(fileName, Buffer.from(arrayBuffer));

    console.log('Image downloaded successfully.');
  } catch (error) {
    console.error('Error downloading image:', error);
  }
}
