import { Module } from "@nestjs/common";
import { TelegramService } from "@tg/telegram.service";
import { TelegramUpdate } from "@tg/telegram.update";
import { StickerService } from "@elements/entities/sticker.service";
import { VkService } from "@vk/vk.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sticker } from "@elements/entities/sticker.entity";
import { Hook } from "@hooks/hooks.entity";
import { HooksService } from "@hooks/hooks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Sticker, Hook])],
  providers: [
    TelegramService,
    TelegramUpdate,
    StickerService,
    HooksService,
    VkService,
  ],
})
export class TelegramModule {}
