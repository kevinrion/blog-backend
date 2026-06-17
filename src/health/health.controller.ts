import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../database/prisma.service';

@ApiTags('health')
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe — app is running' })
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — app can reach the database' })
  async getReady(): Promise<{ status: 'ok' }> {
    const isHealthy = await this.prisma.isHealthy();

    if (!isHealthy) {
      throw new ServiceUnavailableException('Database is not reachable');
    }

    return { status: 'ok' };
  }
}
