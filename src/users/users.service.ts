import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { toUserResponse } from '../common/mappers/user.mapper';
import { PrismaService } from '../database/prisma.service';
import type { UserResponseDto } from '../auth/dto/user-response.dto';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      },
    });

    return toUserResponse(user);
  }

  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(toUserResponse);
  }

  async adminUpdateUser(id: string, dto: AdminUpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      },
    });

    return toUserResponse(user);
  }

  isAdminRole(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
}
