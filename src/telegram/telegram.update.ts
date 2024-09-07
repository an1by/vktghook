import { Ctx, Hears, InjectBot, On, Start, Update } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import { InjectRepository } from "@nestjs/typeorm";
import { Hook } from "@hooks/hooks.entity";
import { Repository } from "typeorm";
import { Sticker } from "@elements/entities/sticker.entity";

@Update()
export class TelegramUpdate {
  constructor(
    @InjectRepository(Hook) private hooksRepository: Repository<Hook>,
    @InjectRepository(Sticker) private stickersRepository: Repository<Sticker>,
    @InjectBot()
    private bot: Telegraf<Context>,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply("Hello world!");
  }

  @On("message_reaction")
  async onMessageReaction(@Ctx() ctx: Context) {
    const reaction = ctx.reactions;
  }

  @Hears("!clear")
  async clear(@Ctx() ctx: Context) {
    const hooks = await this.hooksRepository.find();
    for (const hook of hooks) {
      await this.bot.telegram.deleteForumTopic(
        process.env.TELEGRAM_CHAT_ID,
        hook.telegramTopic,
      );
    }
    await this.hooksRepository.clear();
    await this.stickersRepository.clear();
  }
}
