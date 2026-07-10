// Core data shapes. In vet terms: a Client is the owner, a Patient is the animal.
// One Client can have many Patients (pets).

export type Patient = {
  id: string;
  name: string;
  species: string;      // e.g. Dog, Cat
  breed?: string;
  sex?: string;         // Male / Female / Male neutered / Female spayed
  weightKg?: number;    // body weight in kg — required for dose calculations
  photoUri?: string;    // local image URI (camera or gallery)
};

export type Client = {
  id: string;
  name: string;
  phone?: string;
  patients: Patient[];
  createdAt: string;    // ISO
};

export type Reminder = {
  id: string;
  clientId: string;
  clientName: string;
  dateTime: string;        // ISO — the next visit date & time
  notificationId?: string; // OS-scheduled notification handle (so we can cancel it)
  done: boolean;
};
