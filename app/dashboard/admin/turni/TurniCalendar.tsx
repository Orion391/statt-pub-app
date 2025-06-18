// by Orion

'use client';
import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import itLocale from '@fullcalendar/core/locales/it';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  getDocs,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface TurnoEvent extends EventInput {
  id: string;
  personale: string;
  area: 'Sala' | 'Cucina';
}

// — DisponTable (rimane invariato) —
function DisponTable({ area }: { area: 'Sala' | 'Cucina' }) {
  const [byPerson, setByPerson] = useState<Record<string, Date[]>>({});
  useEffect(() => {
    const q = query(collection(db, 'disponibilita'), where('area', '==', area));
    const unsub = onSnapshot(q, snap => {
      const grouped: Record<string, Date[]> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        const p = data.personale as string;
        const day = data.day.toDate();
        grouped[p] = grouped[p] || [];
        grouped[p].push(day);
      });
      Object.values(grouped).forEach(arr => 
        arr.sort((a, b) => a.getTime() - b.getTime())
      );
      setByPerson(grouped);
    });
    return () => unsub();
  }, [area]);
  const fmt = (d: Date) =>
    d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">
        {area==='Sala' ? '🍷 Disponibilità Sala' : '🍽️ Disponibilità Cucina'}
      </h3>
      <table className="w-full bg-white rounded-lg shadow overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Dipendente</th>
            <th className="px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byPerson).map(([personale, dates]) => (
            <tr key={personale} className="border-t">
              <td className="px-4 py-2 font-medium">{personale}</td>
              <td className="px-4 py-2 space-x-2">
                {dates.map((d,i) => (
                  <span key={i} className="inline-block px-2 py-1 bg-gray-200 rounded text-sm">
                    {fmt(d)}
                  </span>
                ))}
              </td>
            </tr>
          ))}
          {Object.keys(byPerson).length===0 && (
            <tr>
              <td colSpan={2} className="px-4 py-2 text-center text-gray-500">
                Nessuna disponibilità in {area}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// — Modal con la lista filtrata per area dai responsabili caricati — 
function Modal({
  open, onClose, onSave, onDelete,
  selectedDate, personale, setPersonale,
  area, setArea, allDipendenti, isEditing
}: {
  open: boolean;
  onClose(): void;
  onSave(start: string): void;
  onDelete(): void;
  selectedDate: string;
  personale: string;
  setPersonale(p: string): void;
  area: 'Sala'|'Cucina';
  setArea(a: 'Sala'|'Cucina'): void;
  allDipendenti: Array<{ nome: string; area: string }>;
  isEditing: boolean;
}) {
  const [startTime, setStartTime] = useState('11:00');
  if (!open) return null;
  // filtro client-side per area
  const candidates = allDipendenti
    .filter(d => d.area === area)
    .map(d => d.nome);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Turno: {selectedDate}</h2>
        <label className="block mb-3">
          Area
          <select
            value={area}
            onChange={e => setArea(e.target.value as any)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="Sala">Sala</option>
            <option value="Cucina">Cucina</option>
          </select>
        </label>
        <label className="block mb-3">
          Dipendente
          <select
            value={personale}
            onChange={e => setPersonale(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">-- seleziona --</option>
            {candidates.length > 0 ? (
              candidates.map(n => (
                <option key={n} value={n}>{n}</option>
              ))
            ) : (
              <option disabled>Nessun dipendente</option>
            )}
          </select>
        </label>
        <label className="block mb-4">
          Inizio
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">
            Annulla
          </button>
          <div className="space-x-2">
            {isEditing && (
              <button onClick={onDelete} className="px-4 py-2 rounded bg-red-600 text-white">
                Elimina
              </button>
            )}
            <button onClick={() => onSave(startTime)} className="px-4 py-2 rounded bg-orange-500 text-white">
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTurniPage() {
  const router = useRouter();

  // SETTINGS
  const [weekStart, setWeekStart] = useState<Date|null>(null);
  const [weekCount, setWeekCount] = useState(1);

  // TURNI
  const [events, setEvents]       = useState<TurnoEvent[]>([]);
  const [showSala, setShowSala]   = useState(true);
  const [showCucina, setShowCucina] = useState(true);

  // MODAL & FORM
  const [modalOpen, setModalOpen]       = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [personale, setPersonale]       = useState('');
  const [area, setArea]                 = useState<'Sala'|'Cucina'>('Sala');
  const [allDipendenti, setAllDipendenti] = useState<Array<{ nome:string; area:string }>>([]);
  const [editingId, setEditingId]       = useState<string|null>(null);

  // 1) carica settings
  useEffect(() => {
    getDoc(doc(db,'settings','disponibilita')).then(cfg => {
      if (cfg.exists()) {
        const d = cfg.data() as any;
        setWeekStart(d.weekStart.toDate());
        setWeekCount(d.weekCount);
      }
    });
  }, []);

  // 2) carica lista dipendenti
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db,'users'));
      const list: Array<{ nome:string; area:string }> = [];
      snap.docs.forEach(d => {
        const u = d.data() as any;
        if (['dipendente fisso','dipendente serata'].includes(u.tipo)) {
          list.push({ nome: u.nome, area: u.area });
        }
      });
      setAllDipendenti(list);
    })();
  }, []);

  // 3) sottoscrivi turni
  useEffect(() => {
    const q = query(collection(db,'turni'), orderBy('start','asc'));
    const unsub = onSnapshot(q, snap => {
      setEvents(
        snap.docs.map(d => {
          const data = d.data() as any;
          const startISO = data.start.toDate().toISOString();
          const endISO   = new Date(data.start.toDate().getTime()+3600000).toISOString();
          return {
            id: d.id,
            title: data.personale,
            start: startISO,
            end: endISO,
            personale: data.personale,
            area: data.area
          };
        })
      );
    });
    return () => unsub();
  }, []);

  // 4) filtro eventi
  const filteredEvents = useMemo(
    () => events.filter(e =>
      (e.area==='Sala'   && showSala) ||
      (e.area==='Cucina' && showCucina)
    ),
    [events, showSala, showCucina]
  );

  // 5) evidenzia settimane
  const dayCellClassNames = ({ date }: { date: Date }) => {
    if (!weekStart) return [];
    const t     = date.getTime();
    const start = weekStart.getTime();
    const end   = start + weekCount * 7 * 24 * 3600 * 1000;
    return t>=start && t<end ? ['bg-yellow-100'] : [];
  };

  // 6) handlers FullCalendar
  const handleSelect = (sel: DateSelectArg) => {
    setSelectedDate(sel.startStr.slice(0,10));
    setPersonale('');
    setArea('Sala');
    setEditingId(null);
    setModalOpen(true);
  };
  const handleEventClick = (clk: EventClickArg) => {
    const ev = clk.event.extendedProps as any;
    setSelectedDate(clk.event.startStr.slice(0,10));
    setPersonale(ev.personale);
    setArea(ev.area);
    setEditingId(clk.event.id);
    setModalOpen(true);
  };

  // 7) salva / elimina
  const handleSave = async(startTime:string) => {
    if (!personale) return alert('Seleziona un dipendente');
    const start = Timestamp.fromDate(new Date(`${selectedDate}T${startTime}`));
    if (editingId) {
      await updateDoc(doc(db,'turni',editingId), { personale, area, start });
    } else {
      await addDoc(collection(db,'turni'), { personale, area, start });
    }
    setModalOpen(false);
  };
  const handleDelete = async() => {
    if (editingId && confirm('Elimina questo turno?')) {
      await deleteDoc(doc(db,'turni',editingId));
      setModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ← Torna alla Dashboard */}
      <div className="p-4">
        <button onClick={()=>router.push('/dashboard/admin')} className="text-orange-600 hover:underline">
          ← Torna alla Dashboard
        </button>
      </div>

      {/* Checkbox filtro Sala/Cucina */}
      <div className="px-6 py-2 flex items-center space-x-6">
        <label className="inline-flex items-center space-x-2">
          <input type="checkbox" checked={showSala} onChange={()=>setShowSala(x=>!x)} />
          <span>Sala</span>
        </label>
        <label className="inline-flex items-center space-x-2">
          <input type="checkbox" checked={showCucina} onChange={()=>setShowCucina(x=>!x)} />
          <span>Cucina</span>
        </label>
      </div>

      {/* FullCalendar */}
      <div className="flex-1 overflow-auto px-6">
        <FullCalendar
          plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          selectable
          select={handleSelect}
          eventClick={handleEventClick}
          events={filteredEvents as EventInput[]}
          dayHeaderFormat={{ weekday: 'short' }}
          eventTimeFormat={{ hour:'2-digit', minute:'2-digit', hour12:false }}
          height="auto"
          dayCellClassNames={dayCellClassNames}
        />
      </div>

      {/* Disponibilità */}
      <div className="p-6 border-t space-y-8">
        <DisponTable area="Sala" />
        <DisponTable area="Cucina" />
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          selectedDate={selectedDate}
          onClose={()=>setModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          personale={personale}
          setPersonale={setPersonale}
          area={area}
          setArea={setArea}
          allDipendenti={allDipendenti}
          isEditing={!!editingId}
        />
      )}
    </div>
  );
}