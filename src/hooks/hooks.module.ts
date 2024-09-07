import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Hook } from "./hooks.entity";
import { HooksService } from "./hooks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Hook])],
  providers: [HooksService],
})
export class HooksModule {}
