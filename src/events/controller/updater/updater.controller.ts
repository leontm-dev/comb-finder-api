import { Controller, Patch } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UpdaterService } from 'src/events/services/updater/updater.service';

@ApiExcludeController()
@Controller('updater')
export class UpdaterController {
  constructor(
    private readonly updaterService: UpdaterService,
  ) {}

  @Patch('cron')
  async runCronJob() {
    return await this.updaterService.updateLastEvents();
  }
}
