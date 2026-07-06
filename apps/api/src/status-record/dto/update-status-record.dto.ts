import { PartialType } from '@nestjs/swagger';
import { CreateStatusRecordDto } from './create-status-record.dto';

export class UpdateStatusRecordDto extends PartialType(CreateStatusRecordDto) {}
