type Class<T = unknown> = { new (): T };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ProcessEnv {
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID: string;

    STICKER_SIZE: `${number}`;

    VK_ACCESS_TOKEN: string;

    POSTGRES_HOST: string;
    POSTGRES_PORT: string;
    POSTGRES_USERNAME: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DATABASE: string;
  }
}
