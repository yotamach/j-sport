import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SetFavoriteTeamDto } from "./dto/set-favorite-team.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { JwtPayload } from "./jwt.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.getById(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me/favorite-team")
  setFavoriteTeam(@CurrentUser() user: JwtPayload, @Body() dto: SetFavoriteTeamDto) {
    return this.auth.setFavoriteTeam(user.sub, dto.teamId);
  }
}
