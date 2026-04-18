import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.note.findMany({
      where: { author_id: userId, is_trashed: false },
      orderBy: { updated_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.author_id !== userId) throw new ForbiddenException('Access denied');
    return note;
  }

  async create(body: any, userId: string) {
    const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
    if (!workspaceId) {
      throw new NotFoundException('DEFAULT_WORKSPACE_ID missing in environment');
    }

    return this.prisma.note.create({
      data: {
        id: randomUUID(),
        workspace_id: workspaceId,
        author_id: userId,
        title: (body.title || 'Untitled').trim(),
        content_text: body.content_text || '',
      },
    });
  }

  async update(id: string, body: any, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.author_id !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.note.update({
      where: { id },
      data: {
        title: body.title ?? note.title,
        content_text: body.content_text ?? note.content_text,
      },
    });
  }

  async remove(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.author_id !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.note.delete({ where: { id } });
  }
}