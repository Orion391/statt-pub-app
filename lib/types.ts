// lib/types.ts
import { Timestamp } from 'firebase/firestore';
import { EventInput } from '@fullcalendar/core'

export interface Disponibilita extends EventInput {
    id?: string;
    personale: string;
    area: 'Sala' | 'Cucina';
    day: Timestamp; // mezzanotte del giorno selezionato
}