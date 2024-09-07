import { On, Update } from "nestjs-vk";
import { MessageContext } from "vk-io";
import { Ctx } from "nestjs-telegraf";
import { Inject } from "@nestjs/common";
import { TelegramService } from "@tg/telegram.service";
import { HooksService } from "@hooks/hooks.service";
import { VkService } from "@vk/vk.service";

@Update()
export class VkUpdate {
  constructor(
    @Inject()
    private readonly telegramService: TelegramService,
    @Inject()
    private readonly hooksService: HooksService,
    @Inject()
    private readonly vkService: VkService,
  ) {}

  @On("message_new")
  async onNewMessage(@Ctx() ctx: MessageContext) {
    if (!(ctx instanceof MessageContext)) {
      return;
    }

    await ctx.loadMessagePayload();

    const vkChat = ctx.isChat ? ctx.chatId! : ctx.senderId;

    let hook = await this.hooksService.getHook({ vkChat });
    if (!hook) {
      let title;
      if (ctx.isChat) {
        title = (await this.vkService.getChat(ctx.chatId!)).title;
      } else if (ctx.isGroup) {
        title = await this.vkService.getGroupName(ctx.senderId);
      } else if (ctx.isDM) {
        title = await this.vkService.getUserName(ctx.senderId);
      }

      if (title) {
        hook = await this.hooksService.createHook(vkChat, title);
      }
    }

    if (hook) {
      if (!hook.banned) {
        await this.telegramService.sendMessage(ctx, hook);
      }
      return;
    }

    if (ctx.hasForwards) {
      console.log(ctx.text);
      for (const item of ctx.forwards) {
        console.log(item.text);
        for (const forward of item.forwards) {
          console.log(forward.text);
        }
      }
      return;
    }
  }
}
