// Simple local data layer backed by AsyncStorage.
// This is deliberately isolated so we can later swap it for Supabase
// (with real auth + per-clinic row-level security) without touching the screens.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Patient, Reminder } from './types';

const CLIENTS_KEY = 'symptovet.clients';
const REMINDERS_KEY = 'symptovet.reminders';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function read<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function write<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Clients ---------- */

export async function getClients(): Promise<Client[]> {
  const list = await read<Client>(CLIENTS_KEY);
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(id: string): Promise<Client | undefined> {
  const list = await read<Client>(CLIENTS_KEY);
  return list.find((c) => c.id === id);
}

export async function addClient(data: { name: string; phone?: string }): Promise<Client> {
  const list = await read<Client>(CLIENTS_KEY);
  const client: Client = {
    id: newId(),
    name: data.name.trim(),
    phone: data.phone?.trim() || undefined,
    patients: [],
    createdAt: new Date().toISOString(),
  };
  list.push(client);
  await write(CLIENTS_KEY, list);
  return client;
}

export async function addPatient(clientId: string, patient: Omit<Patient, 'id'>): Promise<void> {
  const list = await read<Client>(CLIENTS_KEY);
  const client = list.find((c) => c.id === clientId);
  if (!client) return;
  client.patients.push({ ...patient, id: newId() });
  await write(CLIENTS_KEY, list);
}

// Find a patient (and its owner) by patient id, across all clients.
// Used by the consult / diagnosis screens.
export async function getPatientContext(
  patientId: string
): Promise<{ client: Client; patient: Patient } | undefined> {
  const list = await read<Client>(CLIENTS_KEY);
  for (const client of list) {
    const patient = client.patients.find((p) => p.id === patientId);
    if (patient) return { client, patient };
  }
  return undefined;
}

/* ---------- Reminders ---------- */

export async function getReminders(): Promise<Reminder[]> {
  const list = await read<Reminder>(REMINDERS_KEY);
  return list.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

export async function remindersForClient(clientId: string): Promise<Reminder[]> {
  const list = await getReminders();
  return list.filter((r) => r.clientId === clientId);
}

export async function addReminder(r: Omit<Reminder, 'id' | 'done'>): Promise<Reminder> {
  const list = await read<Reminder>(REMINDERS_KEY);
  const reminder: Reminder = { ...r, id: newId(), done: false };
  list.push(reminder);
  await write(REMINDERS_KEY, list);
  return reminder;
}

export async function setReminderDone(id: string, done: boolean): Promise<void> {
  const list = await read<Reminder>(REMINDERS_KEY);
  const reminder = list.find((r) => r.id === id);
  if (reminder) {
    reminder.done = done;
    await write(REMINDERS_KEY, list);
  }
}
