const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const entityTypes = [
  'address','atm','bridge','custodial_wallet','darknet_market','dex','dex_aggregator','exchange','fraud_shop',
  'gambling','iaas','individual','lending_platform','marketplace','mining_pool','mixer','nft_marketplace',
  'non_custodial_wallet','onchain_platform','onchain_service','online_pharmacy','organization',
  'payment_service_provider','privacy_protocol','staking_platform','validator','csam_shop','nft_collection',
  'token_contract','nonprofit_organization','ponzi','yield',
  'yield_aggregator','wrapped_token','binary_trading','hacker','hacker_group','illicit_service','malware_service',
  'csam_vendor','broker','otc_desk','payment_gateway','onramp_offramp','derivatives_exchange',
  'stablecoin_issuer','token_issuer','oracle','rpc_provider','blockchain_explorer','analytics_provider','gaming_platform'
];

const flags = [
  'illicit','risky','high_risk_jurisdiction','sanctioned','terrorist_financing','no_kyc','p2p','enforcement_action',
  'scam_reported','phishing_associated','ransomware_associated','malware_associated',
  'stolen_funds_associated','under_investigation','licensed','unlicensed','defunct','rebranded',
  'needs_review','confirmed','low_confidence','kyc_required','kyc_optional','travel_rule_ready'
];

const addressRoles = [
  'deposit','master','master_deposit','master_withdrawal','liquidity_pool','lp_factory','swap_router',
  'bridge_gateway','bridge_router','staking_contract','factory_contract','smart_contract','token_contract',
  'donation_address','org_funds','burning','seized_funds','vote_contract'
];

const incidentTypes = [
  'blacklisted','csam','donation_scam','investment_scam','malware','phishing','ransomware','scam',
  'terrorism_financing','theft','exploit','hack'
];

const networks = ['EVM','BTC','LTC','TRX'];

const categories = [
  'cefi_exchange','defi','payments','custody','lending','staking','derivatives','infrastructure','bridge','privacy',
  'mining','nft','marketplace_general','scam','fraud','phishing','ransomware','malware','darknet','csam'
];

const roles = [
  { code: 'admin', title: 'Admin' },
  { code: 'analyst', title: 'Analyst' },
];

async function main() {
  for (const code of entityTypes) {
    await prisma.entityType.upsert({
      where: { code },
      create: { code, title: code },
      update: { title: code },
    });
  }

  for (const code of flags) {
    await prisma.flag.upsert({
      where: { code },
      create: { code, title: code },
      update: { title: code },
    });
  }

  for (const code of addressRoles) {
    await prisma.addressRole.upsert({
      where: { code },
      create: { code, title: code },
      update: { title: code },
    });
  }

  for (const code of incidentTypes) {
    await prisma.incidentType.upsert({
      where: { code },
      create: { code, title: code },
      update: { title: code },
    });
  }

  for (const code of networks) {
    await prisma.network.upsert({
      where: { code },
      create: { code, title: code },
      update: { title: code },
    });
  }

  for (const code of categories) {
    await prisma.entityCategory.upsert({
      where: { category_code: code },
      create: { category_code: code, title: code },
      update: { title: code },
    });
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: { code: role.code, title: role.title },
      update: { title: role.title },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local' },
    create: { email: 'admin@local', name: 'Admin' },
    update: { name: 'Admin' },
  });
  const adminRole = await prisma.role.findUnique({ where: { code: 'admin' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: admin.id, role_id: adminRole.id } },
      create: { user_id: admin.id, role_id: adminRole.id },
      update: {},
    });
  }

  const file = await prisma.entitiesFile.create({ data: { file_name: 'Core Entities', description: 'Seed file' } });
  await prisma.entity.create({
    data: {
      entity_uid: 'example.org',
      entity_name: 'Example Org',
      entity_type_code: 'organization',
      entity_description: 'Seed sample organization',
      entity_country: 'US',
      comment: 'Seeded',
      files: { create: { file_id: file.id } },
      categories: { create: [{ category_code: 'infrastructure' }] },
      flags: { create: [{ flag_code: 'needs_review', source: 'manual' }] },
    },
  });

  const folder = await prisma.affiliationsFolder.create({ data: { network_code: 'EVM', folder_name: 'EVM Core' } });
  await prisma.affiliation.create({
    data: {
      folder_id: folder.id,
      network_code: 'EVM',
      address: '0x000000000000000000000000000000000000dead',
      entity_uid: 'example.org',
      address_role_code: 'deposit',
      source: 'manual',
      analyst: 'seed',
    },
  });

  const incFile = await prisma.incidentsFile.create({ data: { month: '2026-02', file_name: '2026-02 incidents' } });
  await prisma.incident.create({
    data: {
      file_id: incFile.id,
      network_code: 'EVM',
      address: '0x000000000000000000000000000000000000dead',
      entity_uid: 'example.org',
      incident_type_code: 'scam',
      incident_date: new Date('2026-02-01'),
      source: 'manual',
      analyst: 'seed',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
