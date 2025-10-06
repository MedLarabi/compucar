export const runtime = 'nodejs';

// Ensure environment variables are loaded
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

export type CreateParcelInput = {
  order_id: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_wilaya_name: string;
  to_commune_name: string;
  product_list: string;
  price: number;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  weight?: number | null;
  is_stopdesk?: boolean;
  stopdesk_id?: number;
  freeshipping?: boolean;
  has_exchange?: boolean;
  do_insurance?: boolean; // Insurance field (always true)
  parcel_sub_type?: string | null;
  has_receipt?: string | null;
  from_wilaya_name?: string;
  from_address?: string;
};

export type CreateParcelResult = {
  tracking?: string;
  label_url?: string;
  status?: string;
};

export type YalidineFeesResponse = {
  from_wilaya_name: string;
  to_wilaya_name: string;
  zone: number;
  retour_fee: number;
  cod_percentage: number;
  insurance_percentage: number;
  oversize_fee: number;
  per_commune: {
    [communeId: string]: {
      commune_id: number;
      commune_name: string;
      express_home: number | null;
      express_desk: number | null;
      economic_home: number | null;
      economic_desk: number | null;
    };
  };
};

// Dynamic configuration getter (similar to Telegram service fix)
function getYalidineConfig() {
  return {
    base: process.env.YALIDINE_API_BASE || "https://api.yalidine.app/v1/",
    id: process.env.YALIDINE_API_ID,
    token: process.env.YALIDINE_API_TOKEN,
    fromWilayaId: process.env.YALIDINE_FROM_WILAYA_ID || "16" // Default to Alger (16)
  };
}

function headers() {
  const config = getYalidineConfig();
  return {
    "Content-Type": "application/json",
    "X-API-ID": config.id,
    "X-API-TOKEN": config.token,
  };
}

export async function yalidineUpdateParcel(
  tracking: string, 
  updates: Partial<CreateParcelInput>
): Promise<{ 
  ok: boolean; 
  data?: CreateParcelResult; 
  error?: string; 
  raw?: any; 
}> {
  try {
    const config = getYalidineConfig();
    
    console.log('🔄 Updating Yalidine parcel:', {
      tracking,
      updates: Object.keys(updates),
      url: `${config.base}parcels/${tracking}`
    });

    // Check if API credentials are configured
    if (!config.base || !config.id || !config.token) {
      console.warn('Yalidine API not configured, returning mock update');
      
      return {
        ok: true,
        data: {
          tracking: tracking,
          label_url: `https://yalidine.app/label/${tracking}`,
          status: 'updated'
        },
        raw: { mock: true, tracking, action: 'update' }
      };
    }

    // Clean null dimensions and unsupported PATCH parameters
    const cleanUpdates = { ...updates };
    if (cleanUpdates.height === null) delete cleanUpdates.height;
    if (cleanUpdates.width === null) delete cleanUpdates.width;
    if (cleanUpdates.length === null) delete cleanUpdates.length;
    // Remove unsupported PATCH parameters (not in official docs)
    delete (cleanUpdates as any).parcel_sub_type;
    delete (cleanUpdates as any).has_receipt;
    delete (cleanUpdates as any).from_address; // Not mentioned in PATCH docs
    // Keep weight as 1 if specified (for proper oversize detection)
    
    console.log('📤 Sending PATCH to Yalidine:', cleanUpdates);

    const res = await fetch(`${config.base}parcels/${tracking}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(cleanUpdates),
      cache: "no-store",
    });

    let raw;
    try {
      raw = await res.json();
    } catch (jsonError) {
      console.error('Failed to parse Yalidine PATCH response as JSON:', jsonError);
      const text = await res.text();
      return { 
        ok: false, 
        error: `Invalid JSON response: ${text.substring(0, 200)}`,
        raw: text 
      };
    }

    console.log('📦 Yalidine PATCH response:', { 
      status: res.status, 
      ok: res.ok, 
      raw: JSON.stringify(raw, null, 2) 
    });

    if (!res.ok) {
      console.error('❌ Yalidine PATCH failed:', raw);
      return { 
        ok: false, 
        error: raw?.message || raw?.error || `HTTP ${res.status}: ${res.statusText}`,
        raw 
      };
    }

    // Yalidine PATCH response should contain the updated parcel data
    const result: CreateParcelResult = {
      tracking: raw?.tracking || tracking, // Keep original tracking if not returned
      label_url: raw?.label_url || raw?.labelUrl || raw?.label,
      status: raw?.status || 'updated'
    };

    console.log('✅ Yalidine parcel updated successfully:', result);
    return { ok: true, data: result, raw };

  } catch (error) {
    console.error('💥 Yalidine update error:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Network error',
      raw: null 
    };
  }
}

export async function yalidineCreateParcel(
  input: CreateParcelInput
): Promise<{ 
  ok: boolean; 
  data?: CreateParcelResult; 
  error?: string; 
  raw?: any; 
}> {
  try {
    console.log('Creating Yalidine parcel:', {
      order_id: input.order_id,
      to_wilaya_name: input.to_wilaya_name,
      to_commune_name: input.to_commune_name,
      price: input.price
    });

    // Check if API credentials are configured
    const config = getYalidineConfig();
    if (!config.base || !config.id || !config.token) {
      console.warn('Yalidine API not configured, creating mock parcel');
      
      // Return mock response for development
      const mockTracking = `YLD${Date.now()}`;
      return {
        ok: true,
        data: {
          tracking: mockTracking,
          label_url: `https://yalidine.app/label/${mockTracking}`,
          status: 'pending'
        },
        raw: { mock: true, tracking: mockTracking }
      };
    }

    // Remove null dimension fields, but keep weight if it's 1 (for proper oversize detection)
    const cleanInput = { ...input };
    if (cleanInput.height === null) delete cleanInput.height;
    if (cleanInput.width === null) delete cleanInput.width;
    if (cleanInput.length === null) delete cleanInput.length;
    if (cleanInput.weight === null) delete cleanInput.weight;

    const res = await fetch(`${config.base}parcels`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify([cleanInput]), // Yalidine expects an array
      cache: "no-store",
    });

    let raw;
    try {
      raw = await res.json();
    } catch (jsonError) {
      console.error('Failed to parse Yalidine response as JSON:', jsonError);
      const text = await res.text();
      return { 
        ok: false, 
        error: `Invalid JSON response: ${text}`, 
        raw: { status: res.status, statusText: res.statusText, body: text }
      };
    }

    if (!res.ok) {
      console.error('Yalidine API error:', {
        status: res.status,
        statusText: res.statusText,
        response: raw
      });
      
      const errorMessage = typeof raw === "string" 
        ? raw 
        : raw?.error || raw?.message || JSON.stringify(raw);
      
      return { 
        ok: false, 
        error: errorMessage, 
        raw 
      };
    }

    // Normalize response - Yalidine may return different formats
    let first = Array.isArray(raw) ? raw[0] : (raw?.parcels?.[0] ?? raw);
    
    // Handle Yalidine's nested response format: { "ORDER_ID": { success: true, tracking: "...", ... } }
    if (first && typeof first === 'object' && !first.tracking && !first.status) {
      // Find the first order data in the response
      const orderKeys = Object.keys(first);
      if (orderKeys.length > 0) {
        const orderData = first[orderKeys[0]];
        if (orderData && typeof orderData === 'object') {
          first = orderData;
        }
      }
    }
    
    const result: CreateParcelResult = {
      tracking: first?.tracking || first?.tracking_code || first?.tracking_number,
      label_url: first?.label_url || first?.labelUrl || first?.label,
      status: first?.status || (first?.success ? 'created' : 'pending')
    };

    console.log('Yalidine parcel created successfully:', result);

    return { 
      ok: true, 
      data: result, 
      raw 
    };

  } catch (error) {
    console.error('Error calling Yalidine API:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      raw: { error: String(error) }
    };
  }
}

export async function yalidineGetParcel(
  tracking: string
): Promise<{ 
  ok: boolean; 
  data?: any; 
  error?: string; 
}> {
  try {
    const config = getYalidineConfig();
    if (!config.base || !config.id || !config.token) {
      return { ok: false, error: 'Yalidine API not configured' };
    }

    const res = await fetch(`${config.base}parcels/${tracking}`, {
      method: "GET",
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return { ok: true, data };

  } catch (error) {
    console.error('Error fetching Yalidine parcel:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function yalidineGetStopDesks(
  wilayaName: string
): Promise<{ 
  ok: boolean; 
  data?: Array<{id: number; name: string; address: string}>; 
  error?: string; 
}> {
  try {
    const config = getYalidineConfig();
    
    if (!config.base || !config.id || !config.token) {
      console.log('⚠️ Yalidine API not configured, using fallback stop desks');
      return {
        ok: true,
        data: [
          { id: 1, name: `Agence Yalidine ${wilayaName} Centre`, address: `Centre ville, ${wilayaName}` },
          { id: 2, name: `Agence Yalidine ${wilayaName} Commercial`, address: `Zone commerciale, ${wilayaName}` },
          { id: 3, name: `Agence Yalidine ${wilayaName} Université`, address: `Cité universitaire, ${wilayaName}` }
        ]
      };
    }

    console.log('📞 Making API call to Yalidine stop desks endpoint...');
    
    // Try different endpoint formats based on API documentation
    const wilayaId = getWilayaIdFromName(wilayaName);
    if (!wilayaId) {
      console.log(`❌ Unknown wilaya name: ${wilayaName}, using fallback`);
      return {
        ok: true,
        data: [
          { id: 1, name: `Agence Yalidine ${wilayaName} Centre`, address: `Centre ville, ${wilayaName}` },
          { id: 2, name: `Agence Yalidine ${wilayaName} Commercial`, address: `Zone commerciale, ${wilayaName}` },
          { id: 3, name: `Agence Yalidine ${wilayaName} Université`, address: `Cité universitaire, ${wilayaName}` }
        ]
      };
    }

    // Try the communes endpoint with has_stop_desk filter to get actual stop desk locations
    const url = `${config.base}communes?wilaya_id=${wilayaId}&has_stop_desk=1`;
    console.log('🔗 API URL:', url);

    const requestHeaders = headers();
    const res = await fetch(url, {
      method: "GET", 
      headers: requestHeaders,
      cache: "no-store",
    });

    console.log('📡 Stop desks API Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.log('❌ Stop desks API Error response:', errorText);
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText} - ${errorText}` };
    }

    const data = await res.json();
    console.log('📦 Raw stop desks API response:', data);
    
    const stopDesks = Array.isArray(data) ? data : data.data || data.stopdesks || [];
    console.log('📋 Processed stop desks:', stopDesks.length, 'items');
    
    // Transform communes with stop desks to stop desk format
    const transformedStopDesks = stopDesks.map((commune: any) => ({
      id: commune.id,
      name: `Agence Yalidine ${commune.name}`,
      address: `${commune.name}, ${wilayaName}`
    }));
    
    return { ok: true, data: transformedStopDesks };

  } catch (error) {
    console.error('Error fetching Yalidine stopdesks:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function yalidineGetWilayas(): Promise<{ 
  ok: boolean; 
  data?: Array<{id: number; name: string; code: string}>; 
  error?: string; 
}> {
  try {
    const config = getYalidineConfig();
    
    if (!config.base || !config.id || !config.token) {
      console.log('⚠️ Yalidine API credentials not configured, using fallback wilayas');
      // Return all 58 Algerian wilayas as fallback data
      return {
        ok: true,
        data: [
          { id: 1, name: "Adrar", code: "01" },
          { id: 2, name: "Chlef", code: "02" },
          { id: 3, name: "Laghouat", code: "03" },
          { id: 4, name: "Oum El Bouaghi", code: "04" },
          { id: 5, name: "Batna", code: "05" },
          { id: 6, name: "Béjaïa", code: "06" },
          { id: 7, name: "Biskra", code: "07" },
          { id: 8, name: "Béchar", code: "08" },
          { id: 9, name: "Blida", code: "09" },
          { id: 10, name: "Bouira", code: "10" },
          { id: 11, name: "Tamanrasset", code: "11" },
          { id: 12, name: "Tébessa", code: "12" },
          { id: 13, name: "Tlemcen", code: "13" },
          { id: 14, name: "Tiaret", code: "14" },
          { id: 15, name: "Tizi Ouzou", code: "15" },
          { id: 16, name: "Alger", code: "16" },
          { id: 17, name: "Djelfa", code: "17" },
          { id: 18, name: "Jijel", code: "18" },
          { id: 19, name: "Sétif", code: "19" },
          { id: 20, name: "Saïda", code: "20" },
          { id: 21, name: "Skikda", code: "21" },
          { id: 22, name: "Sidi Bel Abbès", code: "22" },
          { id: 23, name: "Annaba", code: "23" },
          { id: 24, name: "Guelma", code: "24" },
          { id: 25, name: "Constantine", code: "25" },
          { id: 26, name: "Médéa", code: "26" },
          { id: 27, name: "Mostaganem", code: "27" },
          { id: 28, name: "M'Sila", code: "28" },
          { id: 29, name: "Mascara", code: "29" },
          { id: 30, name: "Ouargla", code: "30" },
          { id: 31, name: "Oran", code: "31" },
          { id: 32, name: "El Bayadh", code: "32" },
          { id: 33, name: "Illizi", code: "33" },
          { id: 34, name: "Bordj Bou Arréridj", code: "34" },
          { id: 35, name: "Boumerdès", code: "35" },
          { id: 36, name: "El Tarf", code: "36" },
          { id: 37, name: "Tindouf", code: "37" },
          { id: 38, name: "Tissemsilt", code: "38" },
          { id: 39, name: "El Oued", code: "39" },
          { id: 40, name: "Khenchela", code: "40" },
          { id: 41, name: "Souk Ahras", code: "41" },
          { id: 42, name: "Tipaza", code: "42" },
          { id: 43, name: "Mila", code: "43" },
          { id: 44, name: "Aïn Defla", code: "44" },
          { id: 45, name: "Naâma", code: "45" },
          { id: 46, name: "Aïn Témouchent", code: "46" },
          { id: 47, name: "Ghardaïa", code: "47" },
          { id: 48, name: "Relizane", code: "48" },
          { id: 49, name: "El M'Ghair", code: "49" },
          { id: 50, name: "El Meniaa", code: "50" },
          { id: 51, name: "Ouled Djellal", code: "51" },
          { id: 52, name: "Bordj Baji Mokhtar", code: "52" },
          { id: 53, name: "Béni Abbès", code: "53" },
          { id: 54, name: "Timimoun", code: "54" },
          { id: 55, name: "Touggourt", code: "55" },
          { id: 56, name: "Djanet", code: "56" },
          { id: 57, name: "In Salah", code: "57" },
          { id: 58, name: "In Guezzam", code: "58" }
        ]
      };
    }

    console.log('📞 Fetching wilayas from Yalidine API...');
    const url = `${config.base}wilayas`;
    
    const requestHeaders = headers();
    const res = await fetch(url, {
      method: "GET", 
      headers: requestHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log('❌ Wilayas API Error:', res.status, errorText);
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText} - ${errorText}` };
    }

    const data = await res.json();
    const wilayas = Array.isArray(data) ? data : data.data || data.wilayas || [];
    console.log(`✅ Retrieved ${wilayas.length} wilayas from Yalidine API`);
    
    return { ok: true, data: wilayas };

  } catch (error) {
    console.error('Error fetching Yalidine wilayas:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function yalidineGetCommunes(
  wilayaName: string
): Promise<{ 
  ok: boolean; 
  data?: Array<{id: number; name: string; wilayaId: number}>; 
  error?: string; 
}> {
  try {
    const buildMock = () => {
      // Comprehensive mock communes for development or fallback
      const mockCommunes: { [key: string]: Array<{id: number; name: string; wilayaId: number}> } = {
        "Alger": [
          { id: 160, name: "Alger Centre", wilayaId: 16 },
          { id: 161, name: "Sidi M'Hamed", wilayaId: 16 },
          { id: 162, name: "El Madania", wilayaId: 16 },
          { id: 163, name: "Hamma El Annasser", wilayaId: 16 },
          { id: 164, name: "Bab El Oued", wilayaId: 16 },
          { id: 165, name: "Bologhine", wilayaId: 16 },
          { id: 166, name: "Casbah", wilayaId: 16 },
          { id: 167, name: "Oued Koriche", wilayaId: 16 },
          { id: 168, name: "Bir Mourad Rais", wilayaId: 16 },
          { id: 169, name: "El Biar", wilayaId: 16 },
          { id: 170, name: "Bouzareah", wilayaId: 16 },
          { id: 171, name: "Birkhadem", wilayaId: 16 },
          { id: 172, name: "El Harrach", wilayaId: 16 },
          { id: 173, name: "Baraki", wilayaId: 16 },
          { id: 174, name: "Oued Smar", wilayaId: 16 },
          { id: 175, name: "Bourouba", wilayaId: 16 },
          { id: 176, name: "Hussein Dey", wilayaId: 16 },
          { id: 177, name: "Kouba", wilayaId: 16 },
          { id: 178, name: "Bachdjerrah", wilayaId: 16 },
          { id: 179, name: "Dar El Beida", wilayaId: 16 },
          { id: 180, name: "Bab Ezzouar", wilayaId: 16 },
          { id: 181, name: "Ben Aknoun", wilayaId: 16 },
          { id: 182, name: "Dely Brahim", wilayaId: 16 },
          { id: 183, name: "Hammamet", wilayaId: 16 },
          { id: 184, name: "Rais Hamidou", wilayaId: 16 },
          { id: 185, name: "Djasr Kasentina", wilayaId: 16 },
          { id: 186, name: "El Mouradia", wilayaId: 16 },
          { id: 187, name: "Hydra", wilayaId: 16 },
          { id: 188, name: "Mohammadia", wilayaId: 16 },
          { id: 189, name: "Bordj El Kiffan", wilayaId: 16 },
          { id: 190, name: "El Magharia", wilayaId: 16 },
          { id: 191, name: "Beni Messous", wilayaId: 16 }
        ],
        "Oran": [
          { id: 310, name: "Oran", wilayaId: 31 },
          { id: 311, name: "Gdyel", wilayaId: 31 },
          { id: 312, name: "Bir El Djir", wilayaId: 31 },
          { id: 313, name: "Hassi Bounif", wilayaId: 31 },
          { id: 314, name: "Es Senia", wilayaId: 31 },
          { id: 315, name: "Arzew", wilayaId: 31 },
          { id: 316, name: "Bethioua", wilayaId: 31 },
          { id: 317, name: "Marsat El Hadjadj", wilayaId: 31 },
          { id: 318, name: "Ain Turk", wilayaId: 31 },
          { id: 319, name: "El Ançor", wilayaId: 31 },
          { id: 320, name: "Oued Tlelat", wilayaId: 31 },
          { id: 321, name: "Tafraoui", wilayaId: 31 },
          { id: 322, name: "Sidi Chami", wilayaId: 31 },
          { id: 323, name: "Boufatis", wilayaId: 31 },
          { id: 324, name: "Mers El Kebir", wilayaId: 31 },
          { id: 325, name: "Bousfer", wilayaId: 31 },
          { id: 326, name: "El Kerma", wilayaId: 31 },
          { id: 327, name: "El Braya", wilayaId: 31 },
          { id: 328, name: "Hassi Ben Okba", wilayaId: 31 },
          { id: 329, name: "Ben Freha", wilayaId: 31 },
          { id: 330, name: "Hassasna", wilayaId: 31 },
          { id: 331, name: "Sidi Ben Yebka", wilayaId: 31 },
          { id: 332, name: "Mesra", wilayaId: 31 },
          { id: 333, name: "Boutlelis", wilayaId: 31 },
          { id: 334, name: "Ain Kerma", wilayaId: 31 },
          { id: 335, name: "Ain Biya", wilayaId: 31 }
        ],
        "Constantine": [
          { id: 250, name: "Constantine", wilayaId: 25 },
          { id: 251, name: "Hamma Bouziane", wilayaId: 25 },
          { id: 252, name: "Didouche Mourad", wilayaId: 25 },
          { id: 253, name: "El Khroub", wilayaId: 25 },
          { id: 254, name: "Ain Abid", wilayaId: 25 },
          { id: 255, name: "Zighoud Youcef", wilayaId: 25 },
          { id: 256, name: "Ouled Rahmoune", wilayaId: 25 },
          { id: 257, name: "Ain Smara", wilayaId: 25 },
          { id: 258, name: "Beni Hamiden", wilayaId: 25 },
          { id: 259, name: "El Aria", wilayaId: 25 },
          { id: 260, name: "Ibn Ziad", wilayaId: 25 },
          { id: 261, name: "Messaoud Boudjriou", wilayaId: 25 }
        ],
        "Blida": [
          { id: 90, name: "Blida", wilayaId: 9 },
          { id: 91, name: "Boufarik", wilayaId: 9 },
          { id: 92, name: "Larbaa", wilayaId: 9 },
          { id: 93, name: "Oued El Alleug", wilayaId: 9 },
          { id: 94, name: "Chebli", wilayaId: 9 },
          { id: 95, name: "Guerrouaou", wilayaId: 9 },
          { id: 96, name: "Soumaa", wilayaId: 9 },
          { id: 97, name: "Mouzaia", wilayaId: 9 },
          { id: 98, name: "El Affroun", wilayaId: 9 },
          { id: 99, name: "Chrea", wilayaId: 9 },
          { id: 100, name: "Hammam Elouane", wilayaId: 9 },
          { id: 101, name: "Bouarfa", wilayaId: 9 },
          { id: 102, name: "Beni Tamou", wilayaId: 9 },
          { id: 103, name: "Bouinan", wilayaId: 9 },
          { id: 104, name: "Ain Romana", wilayaId: 9 },
          { id: 105, name: "Djebabra", wilayaId: 9 },
          { id: 106, name: "Ben Khelil", wilayaId: 9 },
          { id: 107, name: "Souhane", wilayaId: 9 },
          { id: 108, name: "Ouled Yaich", wilayaId: 9 },
          { id: 109, name: "Chiffa", wilayaId: 9 },
          { id: 110, name: "Oued Djer", wilayaId: 9 },
          { id: 111, name: "Beni Mered", wilayaId: 9 },
          { id: 112, name: "Bouguerra", wilayaId: 9 },
          { id: 113, name: "Bougara", wilayaId: 9 },
          { id: 114, name: "Ouled Selama", wilayaId: 9 }
        ]
      };
      // Return specific communes if available, otherwise generic ones
      if (mockCommunes[wilayaName]) {
        return { ok: true as const, data: mockCommunes[wilayaName] };
      }
      return {
        ok: true as const,
        data: [
          { id: 1, name: `${wilayaName} Centre`, wilayaId: 1 },
          { id: 2, name: `${wilayaName} Est`, wilayaId: 1 },
          { id: 3, name: `${wilayaName} Ouest`, wilayaId: 1 },
          { id: 4, name: `${wilayaName} Nord`, wilayaId: 1 },
          { id: 5, name: `${wilayaName} Sud`, wilayaId: 1 },
          { id: 6, name: `${wilayaName} Ville`, wilayaId: 1 },
          { id: 7, name: `${wilayaName} Zone Industrielle`, wilayaId: 1 },
          { id: 8, name: `${wilayaName} Zone Commerciale`, wilayaId: 1 }
        ]
      };
    };

    const config = getYalidineConfig();
    
    if (!config.base || !config.id || !config.token) {
      console.log(`⚠️ Yalidine API credentials not configured, using mock communes for ${wilayaName}`);
      return buildMock();
    }

    // Convert wilaya name to ID for API call
    const wilayaId = getWilayaIdFromName(wilayaName);
    if (!wilayaId) {
      console.log(`❌ Unknown wilaya name: ${wilayaName}, using mock data`);
      return buildMock();
    }

    console.log(`📞 Fetching communes for ${wilayaName} (ID: ${wilayaId}) from Yalidine API...`);
    const url = `${config.base}communes?wilaya_id=${wilayaId}`;
    
    const requestHeaders = headers();
    const res = await fetch(url, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    });

    console.log(`📡 Communes API Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.log(`❌ Communes API Error: ${res.status} - ${errorText}`);
      console.log(`⚠️ Falling back to mock data for ${wilayaName}`);
      return buildMock();
    }

    const data = await res.json();
    console.log(`📦 Raw communes API response:`, data);
    
    const communes = Array.isArray(data) ? data : data.data || data.communes || [];
    console.log(`✅ Retrieved ${communes.length} communes for ${wilayaName} from live API`);
    
    // Transform the data to match our expected format  
    const transformedCommunes = communes.map((commune: any) => ({
      id: commune.id,
      name: commune.name || commune.commune_name,
      wilayaId: commune.wilaya_id || wilayaId
    }));
    
    return { ok: true, data: transformedCommunes };

  } catch (error) {
    console.error('Error fetching Yalidine communes:', error);
    // Fallback to mock data on exceptions
    return {
      ok: true,
      data: [
        { id: 1, name: `${wilayaName} Centre`, wilayaId: 1 },
        { id: 2, name: `${wilayaName} Est`, wilayaId: 1 },
        { id: 3, name: `${wilayaName} Ouest`, wilayaId: 1 },
        { id: 4, name: `${wilayaName} Nord`, wilayaId: 1 },
        { id: 5, name: `${wilayaName} Sud`, wilayaId: 1 }
      ]
    };
  }
}

// Static delivery fees table based on Algerian postal zones and Yalidine's typical rates
// These rates are estimates - update them based on actual Yalidine rates
const DELIVERY_FEES_TABLE = [
  // Zone 1 - Alger and surroundings (closest)
  { wilaya_id: 16, wilaya_name: "Alger", home_delivery: 400, stop_desk: 300, zone: 1 },
  { wilaya_id: 9, wilaya_name: "Blida", home_delivery: 450, stop_desk: 350, zone: 1 },
  { wilaya_id: 10, wilaya_name: "Bouira", home_delivery: 500, stop_desk: 400, zone: 1 },
  { wilaya_id: 15, wilaya_name: "Tizi Ouzou", home_delivery: 500, stop_desk: 400, zone: 1 },
  { wilaya_id: 26, wilaya_name: "Médéa", home_delivery: 500, stop_desk: 400, zone: 1 },
  
  // Zone 2 - Northern wilayas
  { wilaya_id: 2, wilaya_name: "Chlef", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 6, wilaya_name: "Béjaïa", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 18, wilaya_name: "Jijel", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 21, wilaya_name: "Skikda", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 23, wilaya_name: "Annaba", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 27, wilaya_name: "Mostaganem", home_delivery: 550, stop_desk: 450, zone: 2 },
  { wilaya_id: 31, wilaya_name: "Oran", home_delivery: 600, stop_desk: 500, zone: 2 },
  
  // Zone 3 - Central and Eastern wilayas
  { wilaya_id: 19, wilaya_name: "Sétif", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 25, wilaya_name: "Constantine", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 5, wilaya_name: "Batna", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 4, wilaya_name: "Oum El Bouaghi", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 24, wilaya_name: "Guelma", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 12, wilaya_name: "Tébessa", home_delivery: 700, stop_desk: 600, zone: 3 },
  
  // Zone 4 - Southern and remote wilayas
  { wilaya_id: 7, wilaya_name: "Biskra", home_delivery: 750, stop_desk: 650, zone: 4 },
  { wilaya_id: 17, wilaya_name: "Djelfa", home_delivery: 750, stop_desk: 650, zone: 4 },
  { wilaya_id: 3, wilaya_name: "Laghouat", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 30, wilaya_name: "Ouargla", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 8, wilaya_name: "Béchar", home_delivery: 850, stop_desk: 750, zone: 4 },
  { wilaya_id: 11, wilaya_name: "Tamanrasset", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 1, wilaya_name: "Adrar", home_delivery: 1000, stop_desk: 900, zone: 4 },
  
  // Add remaining wilayas with zone-based pricing
  { wilaya_id: 13, wilaya_name: "Tlemcen", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 14, wilaya_name: "Tiaret", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 20, wilaya_name: "Saïda", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 22, wilaya_name: "Sidi Bel Abbès", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 28, wilaya_name: "M'Sila", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 29, wilaya_name: "Mascara", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 32, wilaya_name: "El Bayadh", home_delivery: 750, stop_desk: 650, zone: 4 },
  { wilaya_id: 33, wilaya_name: "Illizi", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 34, wilaya_name: "Bordj Bou Arréridj", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 35, wilaya_name: "Boumerdès", home_delivery: 450, stop_desk: 350, zone: 1 },
  { wilaya_id: 36, wilaya_name: "El Tarf", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 37, wilaya_name: "Tindouf", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 38, wilaya_name: "Tissemsilt", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 39, wilaya_name: "El Oued", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 40, wilaya_name: "Khenchela", home_delivery: 700, stop_desk: 600, zone: 3 },
  { wilaya_id: 41, wilaya_name: "Souk Ahras", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 42, wilaya_name: "Tipaza", home_delivery: 450, stop_desk: 350, zone: 1 },
  { wilaya_id: 43, wilaya_name: "Mila", home_delivery: 650, stop_desk: 550, zone: 3 },
  { wilaya_id: 44, wilaya_name: "Aïn Defla", home_delivery: 500, stop_desk: 400, zone: 2 },
  { wilaya_id: 45, wilaya_name: "Naâma", home_delivery: 750, stop_desk: 650, zone: 4 },
  { wilaya_id: 46, wilaya_name: "Aïn Témouchent", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 47, wilaya_name: "Ghardaïa", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 48, wilaya_name: "Relizane", home_delivery: 600, stop_desk: 500, zone: 3 },
  { wilaya_id: 49, wilaya_name: "Timimoun", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 50, wilaya_name: "Bordj Badji Mokhtar", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 51, wilaya_name: "Ouled Djellal", home_delivery: 750, stop_desk: 650, zone: 4 },
  { wilaya_id: 52, wilaya_name: "Béni Abbès", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 53, wilaya_name: "In Salah", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 54, wilaya_name: "In Guezzam", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 55, wilaya_name: "Touggourt", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 56, wilaya_name: "Djanet", home_delivery: 1000, stop_desk: 900, zone: 4 },
  { wilaya_id: 57, wilaya_name: "El M'Ghair", home_delivery: 800, stop_desk: 700, zone: 4 },
  { wilaya_id: 58, wilaya_name: "El Meniaa", home_delivery: 800, stop_desk: 700, zone: 4 },
];

export async function yalidineGetDeliveryFees(): Promise<{ 
  ok: boolean; 
  data?: Array<{wilaya_id: number; wilaya_name: string; home_delivery: number; stop_desk: number}>; 
  error?: string; 
}> {
  try {
    // Try to fetch real-time delivery fees from Yalidine API first
    const config = getYalidineConfig();
    if (config.base && config.id && config.token) {
      try {
        console.log('🔄 Fetching real-time delivery fees from Yalidine API...');
        const res = await fetch(`${config.base}delivery-fees`, {
          method: "GET",
          headers: headers(),
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Got real-time delivery fees from Yalidine API');
          return {
            ok: true,
            data: Array.isArray(data) ? data : data.fees || data.delivery_fees || []
          };
        } else {
          console.warn(`⚠️ Yalidine delivery fees API returned ${res.status}, falling back to static table`);
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch real-time delivery fees, falling back to static table:', apiError);
      }
    }

    // Fallback to static table with a warning
    console.log('📋 Using static delivery fees table (may be outdated)');
    return {
      ok: true,
      data: DELIVERY_FEES_TABLE
    };
  } catch (error) {
    console.error('Error getting delivery fees:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to get wilaya ID from name
function getWilayaIdFromName(wilayaName: string): string | null {
  const wilayaMap: { [key: string]: string } = {
    "Adrar": "1", "Chlef": "2", "Laghouat": "3", "Oum El Bouaghi": "4", "Batna": "5",
    "Béjaïa": "6", "Biskra": "7", "Béchar": "8", "Blida": "9", "Bouira": "10",
    "Tamanrasset": "11", "Tébessa": "12", "Tlemcen": "13", "Tiaret": "14", "Tizi Ouzou": "15",
    "Alger": "16", "Djelfa": "17", "Jijel": "18", "Sétif": "19", "Saïda": "20",
    "Skikda": "21", "Sidi Bel Abbès": "22", "Annaba": "23", "Guelma": "24", "Constantine": "25",
    "Médéa": "26", "Mostaganem": "27", "M'Sila": "28", "Mascara": "29", "Ouargla": "30",
    "Oran": "31", "El Bayadh": "32", "Illizi": "33", "Bordj Bou Arréridj": "34", "Boumerdès": "35",
    "El Tarf": "36", "Tindouf": "37", "Tissemsilt": "38", "El Oued": "39", "Khenchela": "40",
    "Souk Ahras": "41", "Tipaza": "42", "Mila": "43", "Aïn Defla": "44", "Naâma": "45",
    "Aïn Témouchent": "46", "Ghardaïa": "47", "Relizane": "48", "El M'Ghair": "49", "El Meniaa": "50",
    "Ouled Djellal": "51", "Bordj Baji Mokhtar": "52", "Béni Abbès": "53", "Timimoun": "54",
    "Touggourt": "55", "Djanet": "56", "In Salah": "57", "In Guezzam": "58"
  };
  
  return wilayaMap[wilayaName] || null;
}

// Calculate billable weight according to Yalidine's formula
function calculateBillableWeight(weight: number, length?: number, width?: number, height?: number): number {
  const actualWeight = weight;
  
  // Calculate volumetric weight if dimensions are provided
  let volumetricWeight = 0;
  if (length && width && height) {
    volumetricWeight = length * width * height * 0.0002;
  }
  
  // Return the bigger weight
  return Math.max(actualWeight, volumetricWeight);
}

// Calculate overweight fee according to Yalidine's formula
function calculateOverweightFee(billableWeight: number, oversizeFee: number): number {
  if (billableWeight <= 5) {
    return 0;
  }
  return Math.ceil((billableWeight - 5) * oversizeFee);
}

export async function yalidineGetRealTimeFees(
  toWilayaName: string,
  communeName?: string
): Promise<{ 
  ok: boolean; 
  data?: YalidineFeesResponse; 
  error?: string; 
}> {
  try {
    const config = getYalidineConfig();
    
    if (!config.base || !config.id || !config.token) {
      console.warn('⚠️ Yalidine API credentials not configured. Set YALIDINE_API_BASE, YALIDINE_API_ID, YALIDINE_API_TOKEN environment variables.');
      return { ok: false, error: 'Yalidine API credentials not configured' };
    }

    const toWilayaId = getWilayaIdFromName(toWilayaName);
    if (!toWilayaId) {
      return { ok: false, error: `Unknown wilaya: ${toWilayaName}` };
    }

    const url = `${config.base}fees/?from_wilaya_id=${config.fromWilayaId}&to_wilaya_id=${toWilayaId}`;
    
    console.log('🔄 Fetching real-time fees from Yalidine:', { 
      fromWilayaId: config.fromWilayaId, 
      toWilayaId, 
      fromWilayaName: 'Alger', // Default from wilaya 
      toWilayaName,
      url,
      hasCredentials: { hasId: !!config.id, hasToken: !!config.token }
    });

    const res = await fetch(url, {
      method: "GET",
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Yalidine fees API error:', { 
        status: res.status, 
        statusText: res.statusText, 
        url,
        headers: { 'X-API-ID': config.id?.substring(0, 8) + '...', 'X-API-TOKEN': config.token?.substring(0, 8) + '...' },
        body: errorText.substring(0, 500) 
      });
      return { 
        ok: false, 
        error: `HTTP ${res.status}: ${res.statusText} - ${errorText.substring(0, 100)}` 
      };
    }

    const data: YalidineFeesResponse = await res.json();
    console.log('✅ Got real-time fees from Yalidine:', { 
      from: data.from_wilaya_name, 
      to: data.to_wilaya_name, 
      zone: data.zone,
      communesCount: Object.keys(data.per_commune).length,
      sampleCommunes: Object.values(data.per_commune).slice(0, 3).map(c => ({
        name: c.commune_name,
        express_home: c.express_home,
        express_desk: c.express_desk
      }))
    });

    return { ok: true, data };

  } catch (error) {
    console.error('💥 Error fetching Yalidine real-time fees:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function yalidineCalculateShipping(
  wilayaName: string,
  weight: number,
  isStopdesk: boolean = false,
  communeName?: string,
  length?: number,
  width?: number,
  height?: number
): Promise<{ 
  ok: boolean; 
  data?: { cost: number; currency: string; estimatedDays: number; details?: any }; 
  error?: string; 
}> {
  try {
    console.log('🚚 Calculating shipping for:', { wilayaName, weight, isStopdesk, communeName, dimensions: { length, width, height } });
    
    // Try to get real-time fees from Yalidine API
    const feesResult = await yalidineGetRealTimeFees(wilayaName, communeName);
    
    if (!feesResult.ok || !feesResult.data) {
      console.warn('⚠️ Failed to get real-time fees, using fallback calculation');
      // Fallback calculation
      const baseCost = weight <= 1 ? 400 : weight <= 3 ? 500 : weight <= 5 ? 700 : 1000;
      const stopdeskDiscount = isStopdesk ? 0.8 : 1;
      const cost = Math.round(baseCost * stopdeskDiscount);
      
      return {
        ok: true,
        data: {
          cost,
          currency: "DZD",
          estimatedDays: isStopdesk ? 2 : 3,
          details: { source: 'fallback', reason: feesResult.error }
        }
      };
    }

    const fees = feesResult.data;
    
    // Calculate billable weight
    const billableWeight = calculateBillableWeight(weight, length, width, height);
    
    // Calculate overweight fee
    const overweightFee = calculateOverweightFee(billableWeight, fees.oversize_fee);
    
    // Find the specific commune by name or use the first available one
    let commune: any = null;
    if (communeName) {
      // Search by commune name (case insensitive)
      commune = Object.values(fees.per_commune).find(
        c => c.commune_name.toLowerCase().includes(communeName.toLowerCase()) ||
             communeName.toLowerCase().includes(c.commune_name.toLowerCase())
      );
    }
    
    if (!commune) {
      // Use the first available commune as fallback
      const communeKeys = Object.keys(fees.per_commune);
      if (communeKeys.length > 0) {
        commune = fees.per_commune[communeKeys[0]];
      }
      if (communeName && commune) {
        console.warn(`⚠️ Commune '${communeName}' not found in ${wilayaName}, using '${commune.commune_name}' as fallback`);
      }
    }

    if (!commune) {
      return {
        ok: false,
        error: `No delivery options available for ${wilayaName}`
      };
    }

    // Get base delivery fee according to Yalidine API documentation
    let baseDeliveryFee: number | null = null;
    
    if (isStopdesk) {
      baseDeliveryFee = commune.express_desk;
      if (!baseDeliveryFee && commune.economic_desk) {
        baseDeliveryFee = commune.economic_desk;
      }
    } else {
      baseDeliveryFee = commune.express_home;
      if (!baseDeliveryFee && commune.economic_home) {
        baseDeliveryFee = commune.economic_home;
      }
    }

    if (!baseDeliveryFee || baseDeliveryFee === null) {
      console.error(`❌ No ${isStopdesk ? 'stopdesk' : 'home delivery'} fee available for ${commune.commune_name}`, {
        express_home: commune.express_home,
        express_desk: commune.express_desk,
        economic_home: commune.economic_home,
        economic_desk: commune.economic_desk
      });
      return {
        ok: false,
        error: `No ${isStopdesk ? 'stopdesk' : 'home'} delivery available for ${commune.commune_name}`
      };
    }

    // Calculate total cost
    const totalCost = baseDeliveryFee + overweightFee;
    
    console.log('💰 Shipping calculation details:', {
      wilaya: wilayaName,
      commune: commune.commune_name,
      zone: fees.zone,
      baseDeliveryFee,
      billableWeight,
      overweightFee,
      totalCost,
      isStopdesk
    });
    
    return { 
      ok: true, 
      data: {
        cost: totalCost,
        currency: "DZD",
        estimatedDays: isStopdesk ? 2 : 3,
        details: {
          source: 'yalidine_api',
          zone: fees.zone,
          commune: commune.commune_name,
          baseDeliveryFee,
          billableWeight,
          overweightFee,
          oversizeFeePerKg: fees.oversize_fee
        }
      }
    };

  } catch (error) {
    console.error('💥 Error calculating Yalidine shipping:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
