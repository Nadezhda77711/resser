import { prisma } from './prisma';

export async function buildEntityReport(uid: string): Promise<string> {
  const entity = await prisma.entity.findUnique({
    where: { entity_uid: uid },
    include: {
      entity_type: true,
      flags: { include: { flag: true } },
      categories: { include: { category: true } },
      affiliations: { include: { network: true, address_role: true } },
      incidents: { include: { network: true, incident_type: true } },
    },
  });

  if (!entity) return '# Entity not found';

  const lines: string[] = [];
  lines.push(`# Entity Report: ${entity.entity_uid}`);
  lines.push('');
  lines.push(`**Name:** ${entity.entity_name}`);
  lines.push(`**Type:** ${entity.entity_type.title} (${entity.entity_type.code})`);
  if (entity.entity_country) lines.push(`**Country:** ${entity.entity_country}`);
  if (entity.entity_description) lines.push(`**Description:** ${entity.entity_description}`);
  lines.push('');

  if (entity.categories.length) {
    lines.push('## Categories');
    for (const c of entity.categories) {
      lines.push(`- ${c.category.title} (${c.category.category_code})`);
    }
    lines.push('');
  }

  if (entity.flags.length) {
    lines.push('## Flags');
    for (const f of entity.flags) {
      lines.push(`- ${f.flag.code} (source: ${f.source})`);
    }
    lines.push('');
  }

  if (entity.affiliations.length) {
    lines.push('## Affiliations');
    const byNetwork = new Map<string, Map<string, typeof entity.affiliations>>();
    for (const a of entity.affiliations) {
      const net = a.network.code;
      const role = a.address_role?.code || 'unassigned';
      const netMap = byNetwork.get(net) ?? new Map<string, typeof entity.affiliations>();
      const list = netMap.get(role) ?? [];
      list.push(a);
      netMap.set(role, list);
      byNetwork.set(net, netMap);
    }
    for (const [net, roleMap] of byNetwork) {
      lines.push(`### ${net}`);
      for (const [role, items] of roleMap) {
        lines.push(`- ${role}: ${items.map((a) => a.address).join(', ')}`);
      }
      lines.push('');
    }
  }

  if (entity.incidents.length) {
    lines.push('## Incidents');
    const byType = new Map<string, Map<string, typeof entity.incidents>>();
    for (const i of entity.incidents) {
      const type = i.incident_type.code;
      const date = i.incident_date.toISOString().slice(0, 10);
      const typeMap = byType.get(type) ?? new Map<string, typeof entity.incidents>();
      const list = typeMap.get(date) ?? [];
      list.push(i);
      typeMap.set(date, list);
      byType.set(type, typeMap);
    }
    for (const [type, dateMap] of byType) {
      lines.push(`### ${type}`);
      for (const [date, items] of dateMap) {
        const detail = items.map((i) => `${i.address} (${i.network.code})`).join(', ');
        lines.push(`- ${date}: ${detail}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
