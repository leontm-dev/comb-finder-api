import { Controller, Patch } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UpdaterService } from 'src/maps/services/updater/updater.service';

@ApiExcludeController()
@Controller('maps/updater')
export class UpdaterController {
  constructor(
    private readonly updaterService: UpdaterService,
  ) {}

  @Patch('cron')
  async runCronJob() {
    return await this.updaterService.updateMapsForLast15Events();
  }
}
