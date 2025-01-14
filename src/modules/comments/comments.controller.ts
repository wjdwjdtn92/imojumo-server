import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCommentDto } from './dto/create-comment.dto';
import UserRequest from 'src/modules/auth/types/user-request.interface';
import { PaginationQueryDto } from 'src/shared/dto/pagenation-query.dto';
import { CommentOwnershipGuard } from './guards/comment-ownership.guard';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsLikeService } from 'src/modules/comments-like/comments-like.service';
import { CommentsDislikeService } from 'src/modules/comments-dislike/comments-dislike.service';
import { QueryPostExistGuard } from 'src/modules/posts/guards/query-post-exits.guard';

import { CommentExistGuard } from './guards/comment-exist.guard';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentsLikeService: CommentsLikeService,
    private readonly commentsDislikeService: CommentsDislikeService,
  ) {}

  @HttpCode(201)
  @ApiQuery({ name: 'postId', type: Number, required: true })
  @ApiBearerAuth()
  @Post()
  @UseGuards(QueryPostExistGuard)
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Query('postId', ParseIntPipe) postId: number,
    @Req() request: UserRequest,
  ) {
    return this.commentsService.create(
      createCommentDto,
      postId,
      request.user.id,
    );
  }

  // @ApiBearerAuth()
  @ApiQuery({ name: 'limit', type: Number, required: true })
  @ApiQuery({ name: 'page', type: Number, required: true })
  @ApiQuery({ name: 'postId', type: Number, required: true })
  @Get()
  @Public()
  @UseGuards(QueryPostExistGuard)
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Query('postId', ParseIntPipe) postId: number,
    @Req() request: UserRequest,
  ) {
    const { page, limit } = paginationQueryDto;
    const offset = (page - 1) * limit;

    const { comments, totalCount } =
      await this.commentsService.findAllByPostIdPages(postId, limit, offset);

    return {
      comments,
      pageInfo: {
        page,
        totalCount,
        currentCount: comments.length,
        totalPage: Math.ceil(totalCount / limit),
      },
    };
  }

  @ApiQuery({ name: 'limit', type: Number, required: true })
  @ApiQuery({ name: 'page', type: Number, required: true })
  @ApiBearerAuth()
  @Get('user')
  async findAllByUserId(
    @Query() { page, limit }: PaginationQueryDto,
    @Req() request: UserRequest,
  ) {
    const { comments, pageInfo } = await this.commentsService.findAllByUserId(
      request.user.id,
      page,
      limit,
    );

    return {
      comments,
      pageInfo,
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.commentsService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(CommentExistGuard, CommentOwnershipGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() request: UserRequest,
  ) {
    return await this.commentsService.update(
      updateCommentDto,
      id,
      request.user.id,
    );
  }

  @HttpCode(204)
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(CommentExistGuard, CommentOwnershipGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.commentsService.remove(id);
  }

  @ApiBearerAuth()
  @Post(':id/like')
  @UseGuards(CommentExistGuard)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: UserRequest,
  ) {
    return await this.commentsLikeService.create({
      commentId: id,
      userId: request.user.id,
    });
  }

  @HttpCode(204)
  @ApiBearerAuth()
  @Delete(':id/like')
  @UseGuards(CommentExistGuard)
  async likeRemove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: UserRequest,
  ) {
    await this.commentsLikeService.removeThrow(id, request.user.id);
  }

  @ApiBearerAuth()
  @Post(':id/dislike')
  @UseGuards(CommentExistGuard)
  async dislike(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: UserRequest,
  ) {
    return await this.commentsDislikeService.create({
      commentId: id,
      userId: request.user.id,
    });
  }

  @HttpCode(204)
  @ApiBearerAuth()
  @Delete(':id/dislike')
  @UseGuards(CommentExistGuard)
  async dislikeRemove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: UserRequest,
  ) {
    await this.commentsDislikeService.removeThrow(id, request.user.id);
  }
}
