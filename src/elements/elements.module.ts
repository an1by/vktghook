import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sticker } from "./entities/sticker.entity";
import { StickerService } from "@elements/entities/sticker.service";

@Module({
  imports: [TypeOrmModule.forFeature([Sticker])],
  providers: [StickerService],
})
export class ElementsModule {}
