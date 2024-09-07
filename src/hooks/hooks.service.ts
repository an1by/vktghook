import { Injectable } from "@nestjs/common";
import { Hook } from "./hooks.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ForumTopic } from "@telegraf/types";
import { GetHookProps } from "#/types/GetHookProps";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";

@Injectable()
export class HooksService {
  constructor(
    @InjectBot()
    private telegramBot: Telegraf<Context>,
    @InjectRepository(Hook)
    private hooksRepository: Repository<Hook>,
  ) {}

  public async getHook({
    vkChat,
    telegramTopic,
  }: GetHookProps): Promise<Hook | null> {
    if (vkChat || telegramTopic) {
      return this.hooksRepository.findOneBy(
        vkChat
          ? {
              vkChat,
            }
          : { telegramTopic },
      );
    }
    return null;
  }

  public async createHook(vkChat: number, title: string): Promise<Hook> {
    const topic: ForumTopic = await this.telegramBot.telegram.createForumTopic(
      process.env.TELEGRAM_CHAT_ID,
      title,
    );

    const hook = new Hook();
    hook.vkChat = vkChat;
    hook.telegramTopic = topic.message_thread_id;
    await this.hooksRepository.save(hook);

    return hook;
  }
}
