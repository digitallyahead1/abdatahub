import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataPlan } from '../entities/data-plan.entity';
import { AirtimePricing } from '../entities/airtime-pricing.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { SmePlugService } from './smeplug.service';
import { DanmalamaService } from './danmalama.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class SmePlugSyncService implements OnModuleInit {
  private readonly logger = new Logger(SmePlugSyncService.name);
  private syncInterval: NodeJS.Timeout;

  constructor(
    private smePlugService: SmePlugService,
    private danmalamaService: DanmalamaService,
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

    // Seed Swiftbills data plans on startup
    this.seedSwiftbillsPlans().catch(err => {
      this.logger.error('Failed to seed Swiftbills plans:', err);
    });

    // Seed Danmalama data plans on startup
    this.seedDanmalamaPlans().catch(err => {
      this.logger.error('Failed to seed Danmalama plans:', err);
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
    const provider = 'amzaet';

    // Cleanup legacy invalid plan 531 if present
    await this.dataPlanRepository.delete({ smeplugPlanId: 531, provider });

    // --- Plan 1: MTN SME 5.0 GB 14 days (Plan ID 500) ---
    const apiPlanId1 = 500;
    const plan1 = await this.dataPlanRepository.findOne({
      where: { smeplugPlanId: apiPlanId1, provider },
    });

    if (!plan1) {
      const newPlan = this.dataPlanRepository.create({
        smeplugPlanId: apiPlanId1,
        network: 'mtn',
        bundleName: 'MTN SME 5.0 GB 14 days',
        smeplugCost: 1040,
        sellingPrice: 1040,
        overrideStatus: false,
        visibilityStatus: true,
        provider,
        lastSyncedAt: new Date(),
      });
      await this.dataPlanRepository.save(newPlan);
      this.logger.log('Seeded AMZAET MTN SME 5.0 GB 14 days plan.');
    } else {
      plan1.smeplugCost = 1040;
      await this.dataPlanRepository.save(plan1);
      this.logger.log('Updated AMZAET MTN SME 5.0 GB 14 days cost to 1040.');
    }

    // --- Plan 2: MTN SME 1.0 GB 30 days (Plan ID 532) ---
    const apiPlanId2 = 532;
    const plan2 = await this.dataPlanRepository.findOne({
      where: { smeplugPlanId: apiPlanId2, provider },
    });

    if (!plan2) {
      const newPlan2 = this.dataPlanRepository.create({
        smeplugPlanId: apiPlanId2,
        network: 'mtn',
        bundleName: 'MTN SME 1.0 GB 30 days',
        smeplugCost: 220,
        sellingPrice: 220,
        agentPrice: 220,
        overrideStatus: false,
        visibilityStatus: true,
        provider,
        lastSyncedAt: new Date(),
      });
      await this.dataPlanRepository.save(newPlan2);
      this.logger.log('Seeded AMZAET MTN SME 1.0 GB 30 days plan (ID 532) at ₦220.');
    } else {
      plan2.bundleName = 'MTN SME 1.0 GB 30 days';
      plan2.smeplugCost = 220;
      plan2.sellingPrice = 220;
      plan2.agentPrice = 220;
      plan2.visibilityStatus = true;
      await this.dataPlanRepository.save(plan2);
      this.logger.log('Updated AMZAET MTN SME 1.0 GB 30 days plan (ID 532) cost and price to ₦220.');
    }
  }

  async seedSwiftbillsPlans() {
    const provider = 'swiftbills';

    const plansToSeed = [
      {
        smeplugPlanId: 275,
        network: 'mtn',
        bundleName: 'MTN 5GB (AWOOF) 14 days',
        smeplugCost: 1040,
        sellingPrice: 1040,
        agentPrice: 0,
      },
      {
        smeplugPlanId: 283,
        network: 'mtn',
        bundleName: 'MTN SME 1GB 30 days',
        smeplugCost: 220,
        sellingPrice: 220,
        agentPrice: 0,
      },
      {
        smeplugPlanId: 284,
        network: 'mtn',
        bundleName: 'MTN SME 2GB 30 days',
        smeplugCost: 420,
        sellingPrice: 420,
        agentPrice: 0,
      },
      {
        smeplugPlanId: 286,
        network: 'mtn',
        bundleName: 'MTN SME 5GB 30 days',
        smeplugCost: 1040,
        sellingPrice: 1040,
        agentPrice: 0,
      },
    ];


    for (const p of plansToSeed) {
      const existing = await this.dataPlanRepository.findOne({
        where: { smeplugPlanId: p.smeplugPlanId, provider },
      });

      if (!existing) {
        const newPlan = this.dataPlanRepository.create({
          ...p,
          overrideStatus: false,
          visibilityStatus: true,
          provider,
          lastSyncedAt: new Date(),
        });
        await this.dataPlanRepository.save(newPlan);
        this.logger.log(`Seeded Swiftbills plan: ${p.bundleName} (ID ${p.smeplugPlanId}) at ₦${p.smeplugCost}.`);
      } else {
        // Only update cost fields if not under admin override
        if (!existing.overrideStatus) {
          existing.bundleName = p.bundleName;
          existing.smeplugCost = p.smeplugCost;
          existing.network = p.network;
          existing.lastSyncedAt = new Date();
          await this.dataPlanRepository.save(existing);
          this.logger.log(`Updated Swiftbills plan: ${p.bundleName} (ID ${p.smeplugPlanId}).`);
        } else {
          this.logger.log(`Skipped Swiftbills plan update (admin override active): ${p.bundleName} (ID ${p.smeplugPlanId}).`);
        }
      }
    }
  }

  async seedDanmalamaPlans(): Promise<{ added: number; updated: number; total: number }> {
    const provider = 'danmalama';

    // Comprehensive reference fallback plans
    const fallbackPlans = [
      // MTN
      { smeplugPlanId: 173, network: 'mtn', bundleName: '1GB WEEKLY', smeplugCost: 450, sellingPrice: 450, agentPrice: 0 },
      { smeplugPlanId: 174, network: 'mtn', bundleName: '2GB MONTHLY', smeplugCost: 1000, sellingPrice: 1000, agentPrice: 0 },
      { smeplugPlanId: 175, network: 'mtn', bundleName: '3GB - Monthly', smeplugCost: 1100, sellingPrice: 1100, agentPrice: 0 },
      { smeplugPlanId: 176, network: 'mtn', bundleName: '5GB MONTHLY', smeplugCost: 1400, sellingPrice: 1400, agentPrice: 0 },
      { smeplugPlanId: 522, network: 'mtn', bundleName: '10GB MONTHLY', smeplugCost: 2800, sellingPrice: 2800, agentPrice: 0 },
      { smeplugPlanId: 524, network: 'mtn', bundleName: '20GB MONTHLY', smeplugCost: 5000, sellingPrice: 5000, agentPrice: 0 },
      // AIRTEL
      { smeplugPlanId: 409, network: 'airtel', bundleName: '3GB 2DAYS', smeplugCost: 1000, sellingPrice: 1000, agentPrice: 0 },
      { smeplugPlanId: 411, network: 'airtel', bundleName: '1.5GB DAILY', smeplugCost: 600, sellingPrice: 600, agentPrice: 0 },
      { smeplugPlanId: 293, network: 'airtel', bundleName: 'Data - 2GB', smeplugCost: 850, sellingPrice: 850, agentPrice: 0 },
      { smeplugPlanId: 410, network: 'airtel', bundleName: '5GB WEEKLY', smeplugCost: 1700, sellingPrice: 1700, agentPrice: 0 },
      // GLO
      { smeplugPlanId: 467, network: 'glo', bundleName: '1GB [Corporate] - 30 Days', smeplugCost: 600, sellingPrice: 600, agentPrice: 0 },
      { smeplugPlanId: 469, network: 'glo', bundleName: '2GB [Corporate] - 30 Days', smeplugCost: 1100, sellingPrice: 1100, agentPrice: 0 },
      { smeplugPlanId: 470, network: 'glo', bundleName: '3GB [Corporate] - 30 Days', smeplugCost: 1550, sellingPrice: 1550, agentPrice: 0 },
    ];

    let plansToSeed = fallbackPlans;

    try {
      const liveData = await this.danmalamaService.getDataPlans();
      if (liveData?.status === true && liveData?.data) {
        const livePlans: typeof fallbackPlans = [];
        const networks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];
        for (const net of networks) {
          const arr = liveData.data[net];
          if (Array.isArray(arr)) {
            for (const item of arr) {
              const planIdNum = parseInt(item.planId, 10);
              const price = parseFloat(item.price) || 0;
              if (planIdNum && price > 0) {
                livePlans.push({
                  smeplugPlanId: planIdNum,
                  network: net.toLowerCase(),
                  bundleName: item.name?.trim() || `${net} Data`,
                  smeplugCost: price,
                  sellingPrice: price,
                  agentPrice: 0,
                });
              }
            }
          }
        }
        if (livePlans.length > 0) {
          plansToSeed = livePlans;
          this.logger.log(`Using ${livePlans.length} live plans fetched from Danmalama API.`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not fetch live Danmalama plans; using fallback list: ${e.message}`);
    }

    let added = 0;
    let updated = 0;

    for (const p of plansToSeed) {
      const existing = await this.dataPlanRepository.findOne({
        where: { smeplugPlanId: p.smeplugPlanId, provider },
      });

      if (!existing) {
        const newPlan = this.dataPlanRepository.create({
          ...p,
          overrideStatus: false,
          visibilityStatus: true,
          provider,
          lastSyncedAt: new Date(),
        });
        await this.dataPlanRepository.save(newPlan);
        added++;
        this.logger.log(`Seeded Danmalama plan: ${p.bundleName} (ID ${p.smeplugPlanId}) at ₦${p.smeplugCost}.`);
      } else {
        if (!existing.overrideStatus) {
          existing.bundleName = p.bundleName;
          existing.smeplugCost = p.smeplugCost;
          existing.network = p.network;
          existing.lastSyncedAt = new Date();
          await this.dataPlanRepository.save(existing);
          updated++;
          this.logger.log(`Updated Danmalama plan: ${p.bundleName} (ID ${p.smeplugPlanId}).`);
        } else {
          this.logger.log(`Skipped Danmalama plan update (admin override active): ${p.bundleName} (ID ${p.smeplugPlanId}).`);
        }
      }
    }

    return { added, updated, total: plansToSeed.length };
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
             plan.network = mappedNetwork;
             plan.lastSyncedAt = new Date();
             // Note: DO NOT set plan.visibilityStatus = true here; keep whatever settings the admin saved.

             // If override is inactive, update bundleName and calculate selling price dynamically
             if (!plan.overrideStatus) {
               plan.bundleName = bundleName;
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
