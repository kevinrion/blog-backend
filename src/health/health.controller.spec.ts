import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { isHealthy: jest.Mock };

  beforeEach(async () => {
    prisma = { isHealthy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('getHealth', () => {
    it('returns ok', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('getReady', () => {
    it('returns ok when the database is reachable', async () => {
      prisma.isHealthy.mockResolvedValue(true);

      await expect(controller.getReady()).resolves.toEqual({ status: 'ok' });
    });

    it('throws when the database is unreachable', async () => {
      prisma.isHealthy.mockResolvedValue(false);

      await expect(controller.getReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
