import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  async remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }

  async checkOwnership(id: number, user: User) {
    const post = await this.findOne(id); // Prisma를 사용하여 게시물 조회

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    if (post.authorId !== user.id) {
      throw new ForbiddenException('본인의 게시물만 수정할 수 있습니다.');
    }

    return true;
  }
}
