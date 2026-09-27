import { supabase } from './supabase';
import { Airline, Aircraft, CollectionStats, ChatThread, ChatMessage } from '../types';
import { INITIAL_AIRLINES, INITIAL_AIRCRAFT } from './sampleData';

const AIRLINES_STORAGE_KEY = 'mpc_airlines_data';
const AIRCRAFT_STORAGE_KEY = 'mpc_aircraft_data';
const THREADS_STORAGE_KEY = 'mpc_chat_threads';
const MESSAGES_STORAGE_KEY = 'mpc_chat_messages';

function getLocalAirlines(): Airline[] {
  try {
    const raw = localStorage.getItem(AIRLINES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AIRLINES_STORAGE_KEY, JSON.stringify(INITIAL_AIRLINES));
      return INITIAL_AIRLINES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AIRLINES;
  }
}

function setLocalAirlines(airlines: Airline[]) {
  localStorage.setItem(AIRLINES_STORAGE_KEY, JSON.stringify(airlines));
}

function getLocalAircraft(): Aircraft[] {
  try {
    const raw = localStorage.getItem(AIRCRAFT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AIRCRAFT_STORAGE_KEY, JSON.stringify(INITIAL_AIRCRAFT));
      return INITIAL_AIRCRAFT;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AIRCRAFT;
  }
}

function setLocalAircraft(aircraft: Aircraft[]) {
  localStorage.setItem(AIRCRAFT_STORAGE_KEY, JSON.stringify(aircraft));
}

export async function getAirlines(): Promise<Airline[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      const { data, error } = await supabase.from('airlines').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Falling back to local airlines cache', err);
  }
  return getLocalAirlines();
}

export async function getAirlineById(id: string): Promise<Airline | null> {
  const airlines = await getAirlines();
  return airlines.find((a) => a.id === id) ?? null;
}

export async function saveAirline(airline: Partial<Airline>, id?: string): Promise<string> {
  const airlines = getLocalAirlines();
  let airlineId = id;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      if (id) {
        const { error } = await supabase.from('airlines').update(airline).eq('id', id);
        if (error) console.warn('Supabase update airline failed', error);
      } else {
        const { data, error } = await supabase
          .from('airlines')
          .insert({ ...airline, user_id: sessionData.session.user.id })
          .select('id')
          .single();
        if (!error && data) airlineId = data.id;
      }
    }
  } catch (err) {
    console.warn('Supabase save airline failed, saving locally', err);
  }

  if (airlineId && id) {
    const index = airlines.findIndex((a) => a.id === id);
    if (index !== -1) {
      airlines[index] = { ...airlines[index], ...airline } as Airline;
    }
  } else {
    airlineId = airlineId || `airline-${Date.now()}`;
    const newAirline: Airline = {
      id: airlineId,
      name: airline.name || 'New Airline',
      country: airline.country || 'Unknown',
      headquarters: airline.headquarters || '',
      founded_year: airline.founded_year || new Date().getFullYear(),
      iata_code: airline.iata_code || '',
      icao_code: airline.icao_code || '',
      callsign: airline.callsign || '',
      alliance: airline.alliance || 'None',
      fleet_size: airline.fleet_size || 0,
      status: airline.status || 'active',
      logo_url: airline.logo_url || '',
      description: airline.description || '',
      history: airline.history || '',
      created_at: new Date().toISOString(),
    };
    airlines.unshift(newAirline);
  }

  setLocalAirlines(airlines);
  return airlineId;
}

export async function deleteAirline(id: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      await supabase.from('airlines').delete().eq('id', id);
    }
  } catch (err) {
    console.warn(err);
  }

  const airlines = getLocalAirlines().filter((a) => a.id !== id);
  setLocalAirlines(airlines);

  // Also remove associated aircraft
  const aircraft = getLocalAircraft().filter((ac) => ac.airline_id !== id);
  setLocalAircraft(aircraft);
}

export async function getAircraft(): Promise<Aircraft[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      const { data, error } = await supabase.from('aircraft').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Falling back to local aircraft cache', err);
  }
  return getLocalAircraft();
}

export async function getAircraftByAirline(airlineId: string): Promise<Aircraft[]> {
  const all = await getAircraft();
  return all.filter((a) => a.airline_id === airlineId);
}

export async function saveAircraft(aircraftData: Partial<Aircraft>, id?: string): Promise<string> {
  const all = getLocalAircraft();
  let aircraftId = id;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      if (id) {
        await supabase.from('aircraft').update(aircraftData).eq('id', id);
      } else {
        const { data, error } = await supabase
          .from('aircraft')
          .insert({ ...aircraftData, user_id: sessionData.session.user.id })
          .select('id')
          .single();
        if (!error && data) aircraftId = data.id;
      }
    }
  } catch (err) {
    console.warn('Supabase save aircraft failed, saving locally', err);
  }

  if (aircraftId && id) {
    const idx = all.findIndex((a) => a.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...aircraftData } as Aircraft;
    }
  } else {
    aircraftId = aircraftId || `ac-${Date.now()}`;
    const newAc: Aircraft = {
      id: aircraftId,
      name: aircraftData.name || 'Unknown Aircraft',
      airline_id: aircraftData.airline_id || '',
      manufacturer: aircraftData.manufacturer || 'Airbus',
      family: aircraftData.family || '',
      generation: aircraftData.generation || '',
      role: aircraftData.role || 'passenger',
      status: aircraftData.status || 'active',
      collected: aircraftData.collected ?? false,
      sightings: aircraftData.sightings ?? 1,
      image_url: aircraftData.image_url || '',
      description: aircraftData.description || '',
      created_at: new Date().toISOString(),
    };
    all.push(newAc);
  }

  setLocalAircraft(all);
  return aircraftId;
}

export async function deleteAircraft(id: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      await supabase.from('aircraft').delete().eq('id', id);
    }
  } catch (err) {
    console.warn(err);
  }

  const all = getLocalAircraft().filter((a) => a.id !== id);
  setLocalAircraft(all);
}

export async function toggleAircraftCollected(id: string, collected: boolean): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      await supabase.from('aircraft').update({ collected }).eq('id', id);
    }
  } catch (err) {
    console.warn(err);
  }

  const all = getLocalAircraft();
  const target = all.find((a) => a.id === id);
  if (target) {
    target.collected = collected;
    if (collected) {
      target.sightings = (target.sightings || 0) + 1;
    }
    setLocalAircraft(all);
  }
}

export function computeCollectionStats(airlines: Airline[], aircraft: Aircraft[]): CollectionStats {
  const collected = aircraft.filter((a) => a.collected);
  const families = new Set(aircraft.map((a) => (a.family ?? '').trim()).filter((f) => f.length > 0));
  const uniqueTypes = new Set(collected.map((a) => a.name.trim().toLowerCase()));

  return {
    airlines: airlines.length,
    aircraftTotal: aircraft.length,
    aircraftCollected: collected.length,
    types: uniqueTypes.size,
    families: families.size,
    completion: aircraft.length === 0 ? 0 : Math.round((collected.length / aircraft.length) * 100),
  };
}

export async function getChatThreads(): Promise<ChatThread[]> {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) {
      const initial: ChatThread[] = [
        {
          id: 'thread-welcome',
          title: 'Aviation Collection Overview',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function createChatThread(title: string = 'New conversation'): Promise<string> {
  const threads = await getChatThreads();
  const id = `thread-${Date.now()}`;
  const newThread: ChatThread = {
    id,
    title,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  threads.unshift(newThread);
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  return id;
}

export async function deleteChatThread(id: string): Promise<void> {
  const threads = (await getChatThreads()).filter((t) => t.id !== id);
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  try {
    const raw = localStorage.getItem(`${MESSAGES_STORAGE_KEY}_${threadId}`);
    if (!raw) {
      if (threadId === 'thread-welcome') {
        const welcome: ChatMessage[] = [
          {
            id: 'msg-1',
            thread_id: threadId,
            role: 'assistant',
            content:
              'Hello Commander! I am your AI Aviation Assistant. I can analyze your aircraft collection, track your Airbus vs Boeing counts, tell you which airframes are missing from your fleet, or help you catalogue new carriers. How can I assist your logbook today?',
            created_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`${MESSAGES_STORAGE_KEY}_${threadId}`, JSON.stringify(welcome));
        return welcome;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function sendChatMessage(threadId: string, userContent: string): Promise<ChatMessage> {
  const messages = await getChatMessages(threadId);
  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    thread_id: threadId,
    role: 'user',
    content: userContent,
    created_at: new Date().toISOString(),
  };
  messages.push(userMsg);

  // Generate intelligent response based on current collection
  const airlines = getLocalAirlines();
  const aircraft = getLocalAircraft();
  const collected = aircraft.filter((a) => a.collected);
  const airbusCount = collected.filter((a) => a.manufacturer === 'Airbus').length;
  const boeingCount = collected.filter((a) => a.manufacturer === 'Boeing').length;

  let reply = '';
  const lower = userContent.toLowerCase();

  if (lower.includes('airbus') && lower.includes('boeing')) {
    reply = `In your collected logbook, you currently have **${airbusCount} Airbus** aircraft and **${boeingCount} Boeing** aircraft. ${
      airbusCount > boeingCount
        ? 'Airbus is currently leading your hangar!'
        : boeingCount > airbusCount
        ? 'Boeing has the majority in your collection!'
        : 'Your Airbus and Boeing counts are perfectly tied!'
    }`;
  } else if (lower.includes('which airlines') || lower.includes('what airlines') || lower.includes('airlines in my collection')) {
    reply = `You currently have **${airlines.length} airlines** catalogued in your encyclopedia:\n\n` +
      airlines.map((a, i) => `${i + 1}. **${a.name}** (${a.country}) — ${a.alliance || 'No alliance'}, ${a.fleet_size || 0} fleet size`).join('\n');
  } else if (lower.includes('collected') || lower.includes('what do i have') || lower.includes('my aircraft')) {
    reply = `You have collected **${collected.length} out of ${aircraft.length} aircraft** (${
      aircraft.length ? Math.round((collected.length / aircraft.length) * 100) : 0
    }% completion):\n\n` +
      collected.map((a) => `• **${a.name}** (${a.manufacturer}) - ${a.status.toUpperCase()}, ${a.role}`).join('\n');
  } else if (lower.includes('missing') || lower.includes('next') || lower.includes('recommend')) {
    const uncollected = aircraft.filter((a) => !a.collected);
    if (uncollected.length === 0) {
      reply = `Outstanding! You have collected every aircraft currently in your catalogue! Try adding a new airline to find fresh airframes.`;
    } else {
      reply = `Here are aircraft currently missing from your collected flight journal:\n\n` +
        uncollected.map((a) => `• **${a.name}** (${a.manufacturer} ${a.family || ''}) — uncollected`).join('\n') +
        `\n\n**Recommendation:** Spot the **${uncollected[0].name}** next to boost your collection percentage!`;
    }
  } else {
    reply = `According to your aviation encyclopedia, you are tracking **${airlines.length} airlines** and **${aircraft.length} aircraft types** with a **${
      aircraft.length ? Math.round((collected.length / aircraft.length) * 100) : 0
    }% completion rate**.\n\nYou have collected **${airbusCount} Airbus** and **${boeingCount} Boeing** airframes so far. Would you like a breakdown by country, or recommendations for what to spot next?`;
  }

  const assistantMsg: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    thread_id: threadId,
    role: 'assistant',
    content: reply,
    created_at: new Date().toISOString(),
  };

  messages.push(assistantMsg);
  localStorage.setItem(`${MESSAGES_STORAGE_KEY}_${threadId}`, JSON.stringify(messages));
  return assistantMsg;
}

export async function generateAirlineFromAI(
  images: string[],
  hint: string
): Promise<{
  airline: Omit<Airline, 'id'>;
  aircraft: Omit<Aircraft, 'id'>[];
}> {
  // Simulate AI model recognizing airline from image or hint
  const h = (hint || '').toLowerCase();

  let name = 'Qatar Airways';
  let country = 'Qatar';
  let hq = 'Doha, Qatar';
  let founded = 1993;
  let iata = 'QR';
  let icao = 'QTR';
  let callsign = 'QATARI';
  let alliance = 'oneworld';
  let fleet = 230;
  let desc = 'The state-owned flag carrier of Qatar, known for its ultra-luxurious Qsuite and global hub in Doha.';
  let history = 'Qatar Airways was established in November 1993 and re-launched in 1997 under the mandate of His Excellency Akbar Al Baker, transforming into an award-winning Skytrax 5-star global airline.';

  if (h.includes('klm') || h.includes('dutch') || h.includes('netherlands')) {
    name = 'KLM Royal Dutch Airlines';
    country = 'Netherlands';
    hq = 'Amstelveen, Netherlands';
    founded = 1919;
    iata = 'KL';
    icao = 'KLM';
    callsign = 'KLM';
    alliance = 'SkyTeam';
    fleet = 110;
    desc = 'The oldest airline in the world still operating under its original name, famed for its royal blue livery.';
    history = 'Founded on 7 October 1919, KLM pioneered scheduled civil aviation in Europe and intercontinental flights to the Dutch East Indies.';
  } else if (h.includes('japan') || h.includes('jal')) {
    name = 'Japan Airlines (JAL)';
    country = 'Japan';
    hq = 'Shinagawa, Tokyo, Japan';
    founded = 1951;
    iata = 'JL';
    icao = 'JAL';
    callsign = 'JAPANAIR';
    alliance = 'oneworld';
    fleet = 160;
    desc = 'Flag carrier of Japan, featuring the legendary Tsurumaru (red-crown crane) emblem.';
    history = 'Established in August 1951, Japan Airlines became Japan’s international ambassador in the jet era, connecting Tokyo Haneda and Narita with worldwide destinations.';
  }

  const generatedAirline: Omit<Airline, 'id'> = {
    name,
    country,
    headquarters: hq,
    founded_year: founded,
    iata_code: iata,
    icao_code: icao,
    callsign,
    alliance,
    fleet_size: fleet,
    status: 'active',
    logo_url: images[0] || 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=300&q=80',
    description: desc,
    history,
    created_at: new Date().toISOString(),
  };

  const generatedAircraft: Omit<Aircraft, 'id'>[] = [
    {
      name: `${name.split(' ')[0]} Airbus A350-1000`,
      manufacturer: 'Airbus',
      family: 'A350',
      generation: 'XWB-1000',
      role: 'passenger',
      status: 'active',
      collected: false,
      sightings: 1,
      image_url: images[1] || 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
      description: `Flagship long-haul airliner operated by ${name}.`,
    },
    {
      name: `${name.split(' ')[0]} Boeing 787-9 Dreamliner`,
      manufacturer: 'Boeing',
      family: '787',
      generation: 'Dreamliner',
      role: 'passenger',
      status: 'active',
      collected: false,
      sightings: 1,
      image_url: images[2] || 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1200&q=80',
      description: `Fuel-efficient twin-engine jet deployed on intercontinental routes.`,
    },
  ];

  return {
    airline: generatedAirline,
    aircraft: generatedAircraft,
  };
}
