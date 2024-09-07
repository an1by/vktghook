import { Inject, Injectable } from "@nestjs/common";
import { ForumTopic, Message } from "@telegraf/types";
import { Context, Telegraf } from "telegraf";
import { InjectBot } from "nestjs-telegraf";
import { MessageContext, StickerAttachment } from "vk-io";
import { Hook } from "@hooks/hooks.entity";
import { StickerService } from "@elements/entities/sticker.service";
import { InputFile } from "telegraf/types";
import { Sticker } from "@elements/entities/sticker.entity";
import { VkService } from "@vk/vk.service";
import * as fs from "node:fs";
import { InputMediaPhoto } from "telegraf/src/core/types/typegram";
import StickerMessage = Message.StickerMessage;

@Injectable()
export class TelegramService {
  constructor(
    @InjectBot()
    private bot: Telegraf<Context>,
    @Inject()
    private stickersService: StickerService,
    @Inject()
    private vkService: VkService,
  ) {}

  public async createTopic(name: string): Promise<ForumTopic> {
    return this.bot.telegram.createForumTopic(
      process.env.TELEGRAM_CHAT_ID,
      name,
    );
  }

  async sendMessageAuthor(
    messageAuthor: string | null,
    hook: Hook,
  ): Promise<Message.TextMessage | null> {
    if (!messageAuthor) {
      return null;
    }

    const author = `>**${messageAuthor}**`;
    return this.bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, author, {
      parse_mode: "MarkdownV2",
      message_thread_id: hook.telegramTopic,
    });
  }

  async sendStickerMessage(
    ctx: MessageContext,
    hook: Hook,
  ): Promise<Message.DocumentMessage> {
    const vkSticker: StickerAttachment = ctx.getAttachments("sticker")[0];
    let sticker: Sticker | null =
      await this.stickersService.getSticker(vkSticker);

    let source: string | null = null;
    let photo: InputFile | null;
    if (sticker) {
      photo = { url: sticker.url, filename: "sticker.webp" };
    } else {
      source = await this.stickersService.saveStickerLocally(vkSticker);
      photo = { source: fs.readFileSync(source), filename: "sticker.webp" };
    }

    const photoMessage = await this.bot.telegram.sendDocument(
      process.env.TELEGRAM_CHAT_ID,
      photo,
      {
        message_thread_id: hook.telegramTopic,
        parse_mode: "MarkdownV2",
      },
    );

    if (source) {
      const msg = photoMessage as unknown as StickerMessage;
      sticker = new Sticker();
      sticker.id = vkSticker.id;
      sticker.url = (
        await this.bot.telegram.getFileLink(msg.sticker.file_id)
      ).toString();
      await this.stickersService.createSticker(sticker);

      this.stickersService.deleteStickerLocally(source);
    }

    return photoMessage;
  }

  async sendTextWithAuthor(
    ctx: MessageContext,
    messageAuthor: string | null,
    hook: Hook,
  ): Promise<Message.TextMessage> {
    const author = messageAuthor ? `>**${messageAuthor}**` : "";
    const text = `${author}\n${ctx.text!}`;
    return this.bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text, {
      message_thread_id: hook.telegramTopic,
      parse_mode: "MarkdownV2",
    });
  }

  async sendOnlyText(
    ctx: MessageContext,
    hook: Hook,
  ): Promise<Message.TextMessage | null> {
    if (!ctx.hasText) {
      return null;
    }

    return this.bot.telegram.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      ctx.text!,
      {
        message_thread_id: hook.telegramTopic,
      },
    );
  }

  async sendPhotoAndVideo(
    ctx: MessageContext,
    hook: Hook,
  ): Promise<
    (
      | Message.PhotoMessage
      | Message.DocumentMessage
      | Message.AudioMessage
      | Message.VideoMessage
      | Message.TextMessage
    )[]
  > {
    const photos: InputMediaPhoto[] = [];
    for (const photo of ctx.getAttachments("photo")) {
      await photo.loadAttachmentPayload();
      const url =
        photo.largeSizeUrl || photo.mediumSizeUrl || photo.smallSizeUrl;
      if (url != null) {
        photos.push({ type: "photo", media: url });
      }
    }

    const videos: string[] = [];
    for (const video of ctx.getAttachments("video")) {
      await video.loadAttachmentPayload();
      videos.push(`[${video.title}](${video.player})`);
    }

    const caption = videos.length
      ? "\n\n>**Прикрепленные видео**\n" + videos.join("\n")
      : "";
    let skip_caption = false;

    const sent_messages = [];

    const maximum_photos = 10;
    const total_photos = photos.length;
    const times_to_loop = Math.ceil(total_photos / maximum_photos);
    const photos_left_on_end = total_photos % maximum_photos;

    if (times_to_loop >= 1) {
      for (let i = 1; i <= times_to_loop; i++) {
        const to_send_amount =
          i == total_photos ? photos_left_on_end : maximum_photos;
        if (to_send_amount == 1) {
          const message = await this.bot.telegram.sendPhoto(
            process.env.TELEGRAM_CHAT_ID,
            photos[0].media,
            {
              message_thread_id: hook.telegramTopic,
              caption,
              parse_mode: "MarkdownV2",
            },
          );
          skip_caption = true;
          sent_messages.push(message);
        } else if (to_send_amount >= 2) {
          const start = (i - 1) * maximum_photos;
          const end = start + to_send_amount;
          const photos_to_send = photos.slice(start, end);

          const messages = await this.bot.telegram.sendMediaGroup(
            process.env.TELEGRAM_CHAT_ID,
            photos_to_send,
            {
              message_thread_id: hook.telegramTopic,
            },
          );
          sent_messages.push(...messages);
        }
      }
    }

    if (!skip_caption) {
      const message = await this.bot.telegram.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        caption,
        {
          message_thread_id: hook.telegramTopic,
          parse_mode: "MarkdownV2",
        },
      );
      sent_messages.push(message);
    }
    return sent_messages;
  }

  async sendDocuments(
    ctx: MessageContext,
    hook: Hook,
  ): Promise<Message.DocumentMessage[]> {
    const sent_messages = [];
    for (const attachment of ctx.getAttachments("doc")) {
      await attachment.loadAttachmentPayload();
      const message = await this.bot.telegram.sendDocument(
        process.env.TELEGRAM_CHAT_ID,
        {
          filename: attachment.title,
          url: attachment.url!,
        },
        {
          message_thread_id: hook.telegramTopic,
        },
      );
      sent_messages.push(message);
    }
    return sent_messages;
  }

  async sendVoiceMessage(
    ctx: MessageContext,
    messageAuthor: string | null,
    hook: Hook,
  ): Promise<Message.VoiceMessage[]> {
    const sent_messages = [];
    const author = messageAuthor ? `>**${messageAuthor}**` : undefined;
    for (const attachment of ctx.getAttachments("audio_message")) {
      await attachment.loadAttachmentPayload();
      const message = await this.bot.telegram.sendVoice(
        process.env.TELEGRAM_CHAT_ID,
        {
          url: attachment.oggUrl!,
        },
        {
          message_thread_id: hook.telegramTopic,
          parse_mode: "MarkdownV2",
          caption: author,
        },
      );
      sent_messages.push(message);
    }
    return sent_messages;
  }

  async sendAudioMessage(
    ctx: MessageContext,
    hook: Hook,
  ): Promise<(Message.DocumentMessage | Message.AudioMessage)[]> {
    const sent_messages = [];
    for (const attachment of ctx.getAttachments("audio")) {
      await attachment.loadAttachmentPayload();
      const title = attachment.title!;
      const url = attachment.url!;
      if (title.endsWith(".mp3")) {
        const message = await this.bot.telegram.sendAudio(
          process.env.TELEGRAM_CHAT_ID,
          {
            url: url,
            filename: title,
          },
          { message_thread_id: hook.telegramTopic },
        );
        sent_messages.push(message);
      } else {
        const message = await this.bot.telegram.sendDocument(
          process.env.TELEGRAM_CHAT_ID,
          {
            url: url,
            filename: title,
          },
          { message_thread_id: hook.telegramTopic },
        );
        sent_messages.push(message);
      }
    }
    return sent_messages;
  }

  public async sendMessage(ctx: MessageContext, hook: Hook): Promise<void> {
    const chatType = await this.vkService.getChatType(ctx);
    let messageAuthor: string | null = null;
    const chatId = ctx.chatId || ctx.senderId;
    if (chatType !== "user" && chatType !== "group") {
      messageAuthor = ctx.isUser
        ? await this.vkService.getUserName(ctx.senderId)
        : await this.vkService.getGroupName(ctx.senderId);
    }

    const telegram_messages = [];

    // STICKER
    if (ctx.hasAttachments("sticker")) {
      await this.sendMessageAuthor(messageAuthor, hook);
      telegram_messages.push(await this.sendStickerMessage(ctx, hook));
    }
    // VOICE
    else if (ctx.hasAttachments("audio_message")) {
      telegram_messages.push(
        ...(await this.sendVoiceMessage(ctx, messageAuthor, hook)),
      );
    }
    // MEDIA
    else if (
      ctx.hasAttachments("photo") ||
      ctx.hasAttachments("video") ||
      ctx.hasAttachments("audio") ||
      ctx.hasAttachments("doc")
    ) {
      await this.sendMessageAuthor(messageAuthor, hook);
      telegram_messages.push(await this.sendOnlyText(ctx, hook));
      if (ctx.hasAttachments("photo") || ctx.hasAttachments("video")) {
        telegram_messages.push(...(await this.sendPhotoAndVideo(ctx, hook)));
      }
      if (ctx.hasAttachments("audio")) {
        telegram_messages.push(...(await this.sendAudioMessage(ctx, hook)));
      }
      if (ctx.hasAttachments("doc")) {
        telegram_messages.push(...(await this.sendDocuments(ctx, hook)));
      }
    }
    // ONLY TEXT
    else if (ctx.hasText) {
      telegram_messages.push(
        await this.sendTextWithAuthor(ctx, messageAuthor, hook),
      );
    }
    const telegram_msg_ids = telegram_messages
      .filter((msg) => msg != null)
      .map((msg) => msg.message_id);
    // await this.cacheManager.set(String(chatId), telegram_msg_ids, 86400);
  }
}
