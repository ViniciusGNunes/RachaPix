import type { UF } from './formatters';

const BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';

const cache = new Map<UF, string[]>();

function toPixCity(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export async function getCitiesByState(uf: UF, signal?: AbortSignal): Promise<string[]> {
  const cached = cache.get(uf);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/${uf}/municipios?orderBy=nome`, { signal });
    if (!response.ok) return [];
    const data = (await response.json()) as { nome: string }[];
    const cities = Array.from(new Set(data.map((m) => toPixCity(m.nome))));
    cache.set(uf, cities);
    return cities;
  } catch {
    return [];
  }
}
