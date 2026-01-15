import { removeBackground } from '@imgly/background-removal';

export async function removeBg(imageSrc) {
  try {
    const blob = await removeBackground(imageSrc);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
}
