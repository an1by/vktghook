import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "hooks" })
export class Hook {
  @PrimaryColumn({ unique: true, name: "vk_chat_id" })
  vkChat: number;

  @Column({ unique: true, name: "telegram_thread_id" })
  telegramTopic: number;

  @Column({ type: "bool", default: false })
  banned: boolean;
}
