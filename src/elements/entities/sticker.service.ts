import { Injectable } from "@nestjs/common";
import { StickerAttachment } from "vk-io";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Sticker } from "@elements/entities/sticker.entity";
import axios from "axios";
import * as fs from "node:fs";

@Injectable()
export class StickerService {
  constructor(
    @InjectRepository(Sticker)
    private stickersRepository: Repository<Sticker>,
  ) {}

  public async getSticker(sticker: StickerAttachment): Promise<Sticker | null> {
    return this.stickersRepository.findOneBy({ id: sticker.id });
  }

  public async createSticker(sticker: Sticker): Promise<void> {
    await this.stickersRepository.save(sticker);
  }

  public async saveStickerLocally(sticker: StickerAttachment): Promise<string> {
    const path = `/temp/sticker-${sticker.id}.png`;

    const url = `https://vk.com/sticker/1-${sticker.id}-256b`;
    const imageResponse = await axios.get(url, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(path, imageResponse.data);

    return path;
  }

  public deleteStickerLocally(path: string): void {
    // fs.unlinkSync(path);
  }
}
