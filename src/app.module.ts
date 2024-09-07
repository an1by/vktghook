import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sticker } from "@elements/entities/sticker.entity";
import { Hook } from "@hooks/hooks.entity";
import { VkModule } from "@vk/vk.module";
import { ElementsModule } from "@elements/elements.module";
import { HooksModule } from "@hooks/hooks.module";
import { TelegramModule } from "@tg/telegram.module";
import { VkModule as VkNestModule } from "nestjs-vk";
import * as process from "node:process";
import { TelegrafModule } from "nestjs-telegraf";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: Number.parseInt(process.env.POSTGRES_PORT!),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      logging: true,
      synchronize: true,
      entities: [Sticker, Hook, Error],
      subscribers: [],
      migrations: [],
    }),
    VkNestModule.forManagers({
      useSessionManager: false,
      useSceneManager: true,
      useHearManager: true,
    }),
    VkNestModule.forRoot({
      token: process.env.VK_ACCESS_TOKEN,
    }),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
      launchOptions: {
        allowedUpdates: [
          "message",
          "message_reaction",
          "message_reaction_count",
          "edited_message",
          "poll",
          "poll_answer",
        ],
      },
    }),
    HooksModule,
    ElementsModule,
    VkModule,
    TelegramModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
