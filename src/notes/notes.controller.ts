import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.notesService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.notesService.create(body, user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.notesService.update(id, body, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.remove(id, user.userId);
  }
}