import { Module } from "@nestjs/common";
import { VkService } from "@vk/vk.service";
import { VkUpdate } from "@vk/vk.update";
import { TelegramService } from "@tg/telegram.service";
import { StickerService } from "@elements/entities/sticker.service";
import { HooksService } from "@hooks/hooks.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Hook } from "@hooks/hooks.entity";
import { Sticker } from "@elements/entities/sticker.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Hook, Sticker])],
  providers: [
    VkService,
    VkUpdate,
    TelegramService,
    StickerService,
    HooksService,
  ],
})
export class VkModule {}
