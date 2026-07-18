import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { SmePlugService } from './smeplug.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class SmePlugSyncService implements OnModuleInit {
  private readonly logger = new Logger(SmePlugSyncService.name);
  private syncInterval: NodeJS.Timeout;

  constructor(
    private smePlugService: SmePlugService,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
    @InjectRepository(DataPlan)
    private dataPlanRepository: Repository<DataPlan>,
    @InjectRepository(AirtimePricing)
    private airtimePricingRepository: Repository<AirtimePricing>,
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
  ) {}

  onModuleInit() {
    this.logger.log('SMEPlug Synchronizer Service Initialized.');
    
    // Seed default airtime rates on startup
    this.seedAirtimePricing().catch(err => {
      this.logger.error('Failed to seed default airtime rates:', err);
    });

    // Seed AMZAET data plans on startup
    this.seedAmzaetPlans().catch(err => {
      this.logger.error('Failed to seed AMZAET plans:', err);
    });

    // Run first sync in background after a brief delay
    setTimeout(() => {
      this.runSync().catch(err => {
        this.logger.error('Initial background sync failed:', err);
      });
    }, 5000);

    // Schedule background synchronization to run every 12 hours
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.runSync().catch(err => {
        this.logger.error('Background scheduled sync failed:', err);
      });
    }, twelveHoursMs);
  }

  async seedAirtimePricing() {
    const networks = ['mtn', 'airtel', 'glo', '9mobile'];
    const defaultRates: Record<string, { smeRate: number; sellRate: number }> = {
      mtn: { smeRate: 0.97, sellRate: 0.99 },
      airtel: { smeRate: 0.97, sellRate: 0.99 },
      glo: { smeRate: 0.95, sellRate: 0.98 },
      '9mobile': { smeRate: 0.95, sellRate: 0.98 },
    };

    for (const net of networks) {
      const existing = await this.airtimePricingRepository.findOne({ where: { network: net } });
      if (!existing) {
        const pricing = this.airtimePricingRepository.create({
          network: net,
          smeplugRate: defaultRates[net].smeRate,
          sellingRate: defaultRates[net].sellRate,
          overrideStatus: false,
          visibilityStatus: true,
          lastSyncedAt: new Date(),
        });
        await this.airtimePricingRepository.save(pricing);
        this.logger.log(`Seeded default airtime pricing for ${net.toUpperCase()}`);
      }
    }
  }

  async seedAmzaetPlans() {
    const apiPlanId = 500;
    const provider = 'amzaet';
    const existing = await this.dataPlanRepository.findOne({
      where: { smeplugPlanId: apiPlanId, provider },
    });

    if (!existing) {
      const plan = this.dataPlanRepository.create({
        smeplugPlanId: apiPlanId,
        network: 'mtn',
        bundleName: 'MTN SME 5.0 GB 14 days',
        smeplugCost: 1200,
        sellingPrice: 1200,
        overrideStatus: false,
        visibilityStatus: true,
        provider,
        lastSyncedAt: new Date(),
      });
      await this.dataPlanRepository.save(plan);
      this.logger.log('Seeded default AMZAET MTN Data Plan.');
    }
  }

  async runSync(): Promise<SyncLog> {
    this.logger.log('Starting SMEPlug synchronization run...');
    const startTime = new Date();
    let plansAdded = 0;
    let plansUpdated = 0;
    let plansDisabled = 0;

    try {
      // 1. Fetch dynamic data plans from SMEPlug API
      const livePlansData = await this.smePlugService.getDataPlans();
      
      // Get currently active margins from admin settings
      const settings = await this.adminService.getSettings();
      const margins: Record<string, number> = {
        mtn: Number(settings.mtnMargin) || 10,
        airtel: Number(settings.airtelMargin) || 15,
        glo: Number(settings.gloMargin) || 10,
        '9mobile': Number(settings.mobile9Margin) || 10,
      };

      // Map SMEPlug network IDs to lowercase strings
      const networkMap: Record<string, string> = {
        '1': 'mtn',
        '2': 'airtel',
        '3': '9mobile',
        '4': 'glo',
      };

      const liveSmeplugPlanIds: number[] = [];

      // 2. Loop through each network's plans returned by the API
      for (const networkIdKey of Object.keys(livePlansData)) {
        const mappedNetwork = networkMap[networkIdKey];
        if (!mappedNetwork) continue;

        const apiPlans = livePlansData[networkIdKey] || [];
        const margin = margins[mappedNetwork] || 10;

        for (const apiPlan of apiPlans) {
          const apiPlanId = parseInt(apiPlan.id, 10);
          if (isNaN(apiPlanId)) continue;

          const costPrice = parseFloat(apiPlan.price) || 0;
          const bundleName = apiPlan.name || '';

          liveSmeplugPlanIds.push(apiPlanId);

          // Look up existing plan in DB (only matching SMEPlug provider, NULL treated as smeplug)
          let plan = await this.dataPlanRepository.findOne({ where: { smeplugPlanId: apiPlanId, provider: 'smeplug' } });
          // Also match legacy rows where provider is NULL (pre-migration rows)
          if (!plan) {
            plan = await this.dataPlanRepository.findOne({
              where: { smeplugPlanId: apiPlanId } as any,
            }).then(p => (!p || p.provider === null || p.provider === 'smeplug') ? p : null);
          }

          if (plan) {
             // Update plan details
             plan.smeplugCost = costPrice;
             plan.bundleName = bundleName;
             plan.network = mappedNetwork;
             plan.lastSyncedAt = new Date();
             // Note: DO NOT set plan.visibilityStatus = true here; keep whatever settings the admin saved.

             // If override is inactive, calculate selling price dynamically
             if (!plan.overrideStatus) {
               plan.sellingPrice = costPrice + margin;
             }

             await this.dataPlanRepository.save(plan);
             plansUpdated++;
          } else {
            // Create new plan
            const sellingPrice = costPrice + margin;
            const newPlan = this.dataPlanRepository.create({
              smeplugPlanId: apiPlanId,
              network: mappedNetwork,
              bundleName,
              smeplugCost: costPrice,
              sellingPrice,
              overrideStatus: false,
              visibilityStatus: true,
              provider: 'smeplug',
              lastSyncedAt: new Date(),
            });

            await this.dataPlanRepository.save(newPlan);
            plansAdded++;
          }
        }
      }

      // 3. Disable plans in DB that are no longer available in the API response (only matching SMEPlug provider)
      if (liveSmeplugPlanIds.length > 0) {
        // Find plans that are active/visible but NOT in the live response
        const plansToDisable = await this.dataPlanRepository.createQueryBuilder('plan')
          .where('plan.smeplugPlanId NOT IN (:...ids)', { ids: liveSmeplugPlanIds })
          .andWhere('(plan.provider = :provider OR plan.provider IS NULL)', { provider: 'smeplug' })
          .andWhere('plan.visibilityStatus = :visible', { visible: true })
          .getMany();

        for (const planToDisable of plansToDisable) {
          planToDisable.visibilityStatus = false;
          await this.dataPlanRepository.save(planToDisable);
          plansDisabled++;
        }
      }

      // 4. Update airtime sync dates
      await this.airtimePricingRepository
        .createQueryBuilder()
        .update()
        .set({ lastSyncedAt: new Date() })
        .execute();

      // 5. Create Success Log
      const successLog = this.syncLogRepository.create({
        syncTime: startTime,
        totalPlansAdded: plansAdded,
        totalPlansUpdated: plansUpdated,
        totalPlansDisabled: plansDisabled,
        syncStatus: 'success',
      });
      await this.syncLogRepository.save(successLog);

      this.logger.log(`SMEPlug sync completed successfully. Added: ${plansAdded}, Updated: ${plansUpdated}, Disabled: ${plansDisabled}`);
      return successLog;

    } catch (error: any) {
      this.logger.error('SMEPlug synchronization run failed:', error.message);
      
      const failedLog = this.syncLogRepository.create({
        syncTime: startTime,
        totalPlansAdded: plansAdded,
        totalPlansUpdated: plansUpdated,
        totalPlansDisabled: plansDisabled,
        syncStatus: 'failed',
        errorMessage: error.message,
      });
      await this.syncLogRepository.save(failedLog);
      
      return failedLog;
    }
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
