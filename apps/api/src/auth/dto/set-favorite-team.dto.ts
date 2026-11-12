import { IsInt } from "class-validator";

export class SetFavoriteTeamDto {
  @IsInt()
  teamId!: number;
}
