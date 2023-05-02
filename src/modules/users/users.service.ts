import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

export const roundsOfHashing = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      roundsOfHashing,
    );

    createUserDto.password = hashedPassword;

    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  findOneById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        roundsOfHashing,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    const user = await this.findOneById(id);

    if (user.avatarUrl) {
      const filePath = path.join(
        __dirname,
        'uploads',
        '..',
        '..',
        user.avatarUrl,
      );
      fs.unlinkSync(filePath);
    }
    return this.prisma.user.delete({ where: { id } });
  }

  async uploadAvatar(userId: number, fileName: string) {
    const avatarUrl = `uploads/${fileName}`;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return user;
  }

  async removeAvatar(userId: number) {
    const user = await this.findOneById(userId);
    console.log(user);

    if (user.avatarUrl) {
      const filePath = path.join(
        __dirname,
        'uploads',
        '..',
        '..',
        user.avatarUrl,
      );

      fs.unlinkSync(filePath);
      return await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
      });
    }

    return user;
  }
}
