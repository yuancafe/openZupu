import { PartialType } from '@nestjs/swagger';
import { CreateOcrTaskDto } from './create-ocr-task.dto';

export class UpdateOcrTaskDto extends PartialType(CreateOcrTaskDto) {}
