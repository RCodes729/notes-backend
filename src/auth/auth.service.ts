import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new BadRequestException('Email already registered');

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new BadRequestException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        username,
        email,
        name: dto.name?.trim() || null,
        password_hash: passwordHash,
        // keep if legacy column exists in your table
        password: passwordHash,
      },
      select: { id: true, username: true, email: true, name: true },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { message: 'Signup successful', token, user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, name: true, created_at: true },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isCurrentValid) throw new BadRequestException('Current password is incorrect');

    const isSame = await bcrypt.compare(dto.newPassword, user.password_hash);
    if (isSame) throw new BadRequestException('New password must be different from current password');

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newHash,
        // keep synced for legacy column
        password: newHash,
      },
    });

    return { message: 'Password changed successfully' };
  }
}