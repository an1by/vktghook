import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "stickers" })
export class Sticker {
  @PrimaryColumn({ unique: true, name: "vk_sticker_id" })
  id: number;

  @Column({ unique: true, name: "telegram_image_url" })
  url: string;
}
