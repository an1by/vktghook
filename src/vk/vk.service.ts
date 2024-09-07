import { Inject, Injectable } from "@nestjs/common";
import { DEFAULT_VK_API_NAME } from "nestjs-vk";
import { MessageContext, VK } from "vk-io";
import { UsersGetResponse } from "vk-io/lib/api/schemas/responses";
import { VkChatType } from "#/types/VkChatType";
import { MessagesChat } from "vk-io/lib/api/schemas/objects";
import { Hook } from "@hooks/hooks.entity";

@Injectable()
export class VkService {
  constructor(
    @Inject(DEFAULT_VK_API_NAME)
    private readonly vk: VK,
  ) {}

  public async getUsers(ids: number[]): Promise<UsersGetResponse> {
    return this.vk.api.users.get({ user_ids: ids });
  }

  public async getChatType(ctx: MessageContext): Promise<VkChatType | null> {
    if (ctx.isChat) {
      return "chat";
    }
    if (ctx.isDM) {
      return ctx.isUser ? "user" : "group";
    }
    return null;
  }

  public async getChat(id: number): Promise<MessagesChat> {
    return await this.vk.api.messages.getChat({ chat_id: id });
  }

  public async getGroupName(id: number): Promise<string | null> {
    const groups = await this.vk.api.groups.getById({ group_id: id });
    if (groups.groups.length === 0) {
      return null;
    }
    const group = groups.groups[0];
    return group.name;
  }

  public async getUserName(id: number): Promise<string | null> {
    const users = await this.vk.api.users.get({ user_ids: [id] });
    if (users.length === 0) {
      return null;
    }
    const user = users[0];
    return `${user.first_name} ${user.last_name}`;
  }

  public async setReaction(hook: Hook): Promise<void> {
    const chat = await this.getChat(hook.vkChat);
  }

  // public async sendMessage(ctx: Context, hook: Hook): Promise<void> {
  //   const chat = await this.getChat(hook.vkChat);
  //
  //   this.vk.api.messages.send({});
  // }
}
