import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { AuthResponse, AuthUser } from "@football-portal/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { FootballApiService } from "../football/football-api.service";
import type { User } from "@prisma/client";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly football: FootballApiService,
  ) {}

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      favoriteTeamId: user.favoriteTeamId,
      favoriteTeamName: user.favoriteTeamName,
    };
  }

  private sign(user: User): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("An account with this email already exists");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    return { accessToken: this.sign(user), user: this.toAuthUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return { accessToken: this.sign(user), user: this.toAuthUser(user) };
  }

  async getById(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toAuthUser(user);
  }

  async setFavoriteTeam(userId: string, teamId: number): Promise<AuthUser> {
    const team = await this.football.getTeam(teamId);
    if (!team) throw new NotFoundException("Unknown team");
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { favoriteTeamId: team.id, favoriteTeamName: team.name },
    });
    return this.toAuthUser(user);
  }
}
