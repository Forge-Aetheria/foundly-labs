import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(`${key}__chunks`);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await readChunkCount(key);
    if (count === 0) {
      return SecureStore.getItemAsync(key);
    }
    const chunks: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const chunk = await SecureStore.getItemAsync(`${key}__${index}`);
      if (chunk === null) {
        return null;
      }
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await this.removeItem(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let index = 0; index < chunks; index += 1) {
      await SecureStore.setItemAsync(
        `${key}__${index}`,
        value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks));
  },

  async removeItem(key: string): Promise<void> {
    const count = await readChunkCount(key);
    for (let index = 0; index < count; index += 1) {
      await SecureStore.deleteItemAsync(`${key}__${index}`);
    }
    await SecureStore.deleteItemAsync(`${key}__chunks`);
    await SecureStore.deleteItemAsync(key);
  },
};
