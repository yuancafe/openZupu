import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async processOcr(projectId: string, imageUrl: string) {
    // We create a pending task
    const task = await this.prisma.oCRTask.create({
      data: {
        projectId,
        imageUrl,
        status: 'PROCESSING',
      },
    });

    try {
      // Use Tesseract.js with Traditional Chinese (chi_tra)
      const {
        data: { text },
      } = await Tesseract.recognize(
        imageUrl,
        'chi_tra', // 'chi_sim' can be used for simplified
        { logger: (m) => console.log(m) },
      );

      const completedTask = await this.prisma.oCRTask.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          result: JSON.stringify({
            extractedText: text,
          }),
        },
      });
      return completedTask;
    } catch (error) {
      const failedTask = await this.prisma.oCRTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          result: JSON.stringify({ error: error.message }),
        },
      });
      return failedTask;
    }
  }
}
