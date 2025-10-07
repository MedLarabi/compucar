import slugify from "@sindresorhus/slugify";
import { prisma } from "@/lib/database/prisma";

const BASE = process.env.YALIDINE_API_BASE ?? "https://api.yalidine.app/v1/";
const API_ID = process.env.YALIDINE_API_ID ?? process.env.YALIDINE_API_KEY;
const API_TOKEN = process.env.YALIDINE_API_TOKEN;

type WilayaApi = {
  id: number;
  name: string;
  zone?: number;
  is_deliverable?: number | boolean;
};

type CommuneApi = {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name?: string;
  has_stop_desk?: number | boolean;
  is_deliverable?: number | boolean;
  delivery_time_parcel?: number;
  delivery_time_payment?: number;
};

type StopDeskApi = {
  id: number;
  name: string;
  name_ar?: string;
  address: string;
  wilaya_id: number;
  wilaya_name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
};

type CenterApi = {
  center_id: number;
  name: string;
  address: string;
  gps?: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url: string, attempt = 0): Promise<any> {
  const MAX_RETRIES = 5;
  const BASE_BACKOFF_MS = 600; // gentle default per docs rate limit

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-API-ID": API_ID ?? "",
      "X-API-TOKEN": API_TOKEN ?? "",
    },
    cache: "no-store",
  });

  if (res.ok) {
    return res.json();
  }

  // Handle rate limit and transient errors with retries
  if ((res.status === 429 || (res.status >= 500 && res.status < 600)) && attempt < MAX_RETRIES) {
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader ? Math.max(parseInt(retryAfterHeader, 10), 1) * 1000 : 0;
    const backoff = retryAfterMs || BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
    await sleep(backoff);
    return getJson(url, attempt + 1);
  }

  // Exhausted or non-retryable
  const body = await res.text().catch(() => "");
  throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
}

export async function fetchAllPaginated<T>(path: string, pageParam = "page", pageSize = 50): Promise<T[]> {
  let page = 1;
  const items: T[] = [];
  for (;;) {
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;
    const url = `${BASE}${normalizedPath}?${pageParam}=${page}&page_size=${pageSize}`;
    const data = await getJson(url);
    const batch: T[] = data.data ?? data.items ?? data;
    items.push(...batch);
    const hasMore = Boolean(data?.links?.next) || Boolean(data?.has_more);
    if (!hasMore) break;
    page += 1;
    // small throttle to respect per-second limits
    await sleep(800);
  }
  return items;
}

export async function fetchWilayas(): Promise<WilayaApi[]> {
  // Official docs: GET /v1/wilayas/
  return fetchAllPaginated<WilayaApi>("wilayas/");
}

export async function fetchCommunes(): Promise<CommuneApi[]> {
  // Official docs: GET /v1/communes/
  return fetchAllPaginated<CommuneApi>("communes/");
}

export async function fetchStopDesks(): Promise<StopDeskApi[]> {
  console.log('🔍 Fetching stop desks from Yalidine API...');
  
  // Use the real centers endpoint (discovered from API debugging)
  console.log('1️⃣ Fetching real stop desk centers from /centers/ endpoint...');
  try {
    const centers = await fetchAllPaginated<CenterApi>("centers/");
    
    if (centers && centers.length > 0) {
      console.log(`✅ Found ${centers.length} real stop desk centers from Yalidine API`);
      
      const stopDesks: StopDeskApi[] = centers.map(center => {
        // Parse GPS coordinates if available
        let latitude: number | undefined;
        let longitude: number | undefined;
        
        if (center.gps) {
          try {
            const [lat, lng] = center.gps.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              latitude = lat;
              longitude = lng;
            }
          } catch (error) {
            console.warn(`Failed to parse GPS for center ${center.center_id}: ${center.gps}`);
          }
        }
        
        return {
          id: center.center_id,
          name: center.name,
          address: center.address,
          wilaya_id: center.wilaya_id,
          wilaya_name: center.wilaya_name,
          phone: undefined, // Not provided in centers API
          latitude,
          longitude,
          active: true // Assume all centers from API are active
        };
      });
      
      console.log(`✅ Successfully converted ${stopDesks.length} centers to stop desk format`);
      
      // Show some examples
      console.log('📝 Sample stop desks:');
      stopDesks.slice(0, 3).forEach(sd => {
        console.log(`  - ${sd.name} (ID: ${sd.id}) in ${sd.wilaya_name}`);
        console.log(`    Address: ${sd.address}`);
        if (sd.latitude && sd.longitude) {
          console.log(`    GPS: ${sd.latitude}, ${sd.longitude}`);
        }
      });
      
      return stopDesks;
    } else {
      console.warn('No centers returned from API');
    }
  } catch (error) {
    console.warn('Failed to fetch centers from API:', error);
  }
  
  // Fallback: extract from communes with stop desks
  console.log('2️⃣ Fallback: extracting from communes with has_stop_desk=true...');
  try {
    const communesWithStopDesks = await fetchAllPaginated<CommuneApi>("communes/?has_stop_desk=true");
    
    if (communesWithStopDesks && communesWithStopDesks.length > 0) {
      console.log(`✅ Found ${communesWithStopDesks.length} communes with stop desks as fallback`);
      
      const stopDesks: StopDeskApi[] = communesWithStopDesks
        .filter(commune => commune.id && commune.wilaya_id)
        .map(commune => ({
          id: commune.id + 100000, // Use different ID range for commune-derived stop desks
          name: `Agence Yalidine ${commune.name}`,
          name_ar: commune.name, // Use regular name as fallback for Arabic name
          address: `${commune.name}, ${commune.wilaya_name || 'Unknown'}`,
          wilaya_id: commune.wilaya_id,
          wilaya_name: commune.wilaya_name,
          active: true, // Default to active since commune doesn't have active property
          phone: undefined,
          latitude: undefined,
          longitude: undefined
        }));
      
      console.log(`✅ Generated ${stopDesks.length} stop desks from communes as fallback`);
      return stopDesks;
    }
  } catch (error) {
    console.error('Fallback failed:', error);
  }
  
  console.warn('❌ No stop desk data could be fetched from any source');
  return [];
}

function toSlug(input: string) {
  return slugify(input, { decamelize: false });
}

export async function syncYalidineLocations() {
  const wilayasApi = await fetchWilayas();
  // avoid concurrent paging bursts
  await sleep(800);
  const communesApi = await fetchCommunes();
  await sleep(800);
  const stopDesksApi = await fetchStopDesks();

  for (const w of wilayasApi) {
    await prisma.wilaya.upsert({
      where: { id: w.id },
      update: {
        nameFr: w.name,
        nameAr: null,
        code: null,
        slug: toSlug(w.name),
        active: true,
      },
      create: {
        id: w.id,
        nameFr: w.name,
        nameAr: null,
        code: null,
        slug: toSlug(w.name),
        active: true,
      },
    });
  }

  for (const c of communesApi) {
    await prisma.commune.upsert({
      where: { id: c.id },
      update: {
        wilayaId: c.wilaya_id,
        nameFr: c.name,
        nameAr: null,
        slug: toSlug(`${c.name}-${c.wilaya_id}`),
        active: true,
      },
      create: {
        id: c.id,
        wilayaId: c.wilaya_id,
        nameFr: c.name,
        nameAr: null,
        slug: toSlug(`${c.name}-${c.wilaya_id}`),
        active: true,
      },
    });
  }

  // Upsert stop desks
  for (const sd of stopDesksApi) {
    await prisma.stopDesk.upsert({
      where: { id: sd.id },
      update: {
        wilayaId: sd.wilaya_id,
        name: sd.name,
        nameAr: sd.name_ar || null,
        address: sd.address,
        slug: toSlug(`${sd.name}-${sd.wilaya_id}`),
        active: sd.active ?? true,
        phone: sd.phone || null,
        latitude: sd.latitude || null,
        longitude: sd.longitude || null,
      },
      create: {
        id: sd.id,
        wilayaId: sd.wilaya_id,
        name: sd.name,
        nameAr: sd.name_ar || null,
        address: sd.address,
        slug: toSlug(`${sd.name}-${sd.wilaya_id}`),
        active: sd.active ?? true,
        phone: sd.phone || null,
        latitude: sd.latitude || null,
        longitude: sd.longitude || null,
      },
    });
  }

  // Soft-deactivate anything not returned
  const wilayaIds = wilayasApi.map((w) => w.id);
  const communeIds = communesApi.map((c) => c.id);
  const stopDeskIds = stopDesksApi.map((sd) => sd.id);
  
  await prisma.wilaya.updateMany({ where: { NOT: { id: { in: wilayaIds } } }, data: { active: false } });
  await prisma.commune.updateMany({ where: { NOT: { id: { in: communeIds } } }, data: { active: false } });
  await prisma.stopDesk.updateMany({ where: { NOT: { id: { in: stopDeskIds } } }, data: { active: false } });

  return { 
    wilayas: wilayasApi.length, 
    communes: communesApi.length,
    stopdesks: stopDesksApi.length
  };
}

export async function writeSnapshotJson() {
  const [wilayas, communes, stopdesks] = await Promise.all([
    prisma.wilaya.findMany({ orderBy: { nameFr: "asc" } }),
    prisma.commune.findMany({ orderBy: { nameFr: "asc" } }),
    prisma.stopDesk.findMany({ orderBy: { name: "asc" } }),
  ]);
  const fs = await import("node:fs/promises");
  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(
    "data/yalidineLocations.json",
    JSON.stringify({ wilayas, communes, stopdesks, generatedAt: new Date().toISOString() }, null, 2),
    "utf8"
  );
}

