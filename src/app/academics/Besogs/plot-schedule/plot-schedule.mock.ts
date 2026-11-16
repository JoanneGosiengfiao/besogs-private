export interface SchoolYear { id: string; label: string; }
export interface ScheduleSection { id: string; yearId: string; name: string; level: string; adviser: string; }
export interface ScheduleSubject { id: string; sectionId: string; code: string; title: string; teacherId: string; teacher: string; hours: number; }
export interface ScheduleRoom { id: string; name: string; }
export interface TimeSlot { id: string; label: string; }
export interface ScheduleAssignment { yearId: string; sectionId: string; subjectId: string; teacherId: string; roomId: string; day: string; slotId: string; }

export const SCHOOL_YEARS: SchoolYear[] = [
  { id: '2026', label: '2026–2027' }, { id: '2025', label: '2025–2026' }, { id: '2024', label: '2024–2025' }
];
export const SECTIONS: ScheduleSection[] = [
  { id: 'rose', yearId: '2026', name: 'Rose', level: 'Grade 7', adviser: 'Maria Santos' },
  { id: 'lily', yearId: '2026', name: 'Lily', level: 'Grade 7', adviser: 'Juan Dela Cruz' },
  { id: 'orchid', yearId: '2026', name: 'Orchid', level: 'Grade 8', adviser: 'Ana Reyes' },
  { id: 'jasmine', yearId: '2026', name: 'Jasmine', level: 'Grade 8', adviser: 'Jose Garcia' },
  { id: 'rose-2025', yearId: '2025', name: 'Rose', level: 'Grade 7', adviser: 'Maria Santos' },
  { id: 'lily-2025', yearId: '2025', name: 'Lily', level: 'Grade 7', adviser: 'Juan Dela Cruz' }
];
const CATALOG = [
  { code: 'ENG', title: 'English', teacherId: 'EMP-001', teacher: 'Maria Santos', hours: 4.5 },
  { code: 'MATH', title: 'Mathematics', teacherId: 'EMP-002', teacher: 'Juan Dela Cruz', hours: 4.5 },
  { code: 'SCI', title: 'Science', teacherId: 'EMP-004', teacher: 'Jose Garcia', hours: 4.5 },
  { code: 'FIL', title: 'Filipino', teacherId: 'EMP-005', teacher: 'Patricia Mendoza', hours: 4.5 },
  { code: 'AP', title: 'Araling Panlipunan', teacherId: 'EMP-003', teacher: 'Ana Reyes', hours: 3 },
  { code: 'MAPEH', title: 'Music, Arts, Physical Education and Health', teacherId: 'EMP-006', teacher: 'Mark Villanueva', hours: 4.5 }
];
export const SUBJECTS: ScheduleSubject[] = SECTIONS.filter(section => section.id !== 'jasmine')
  .reduce((all, section) => all.concat(CATALOG.map(subject => ({
    ...subject,
    id: section.id + '-' + subject.code, sectionId: section.id
  }))), [] as ScheduleSubject[]);
export const ROOMS: ScheduleRoom[] = [
  { id: '201', name: 'Room 201' }, { id: '202', name: 'Room 202' }
];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const TIME_SLOTS: TimeSlot[] = [
  { id: '0730', label: '7:30–9:00' }, { id: '0900', label: '9:00–10:30' },
  { id: '1030', label: '10:30–12:00' }, { id: '1300', label: '1:00–2:30' },
  { id: '1430', label: '2:30–4:00' }, { id: '1600', label: '4:00–5:30' }
];
export const ASSIGNMENTS: ScheduleAssignment[] = [
  { yearId: '2026', sectionId: 'rose', subjectId: 'rose-ENG', teacherId: 'EMP-001', roomId: '201', day: 'Monday', slotId: '0730' },
  { yearId: '2026', sectionId: 'rose', subjectId: 'rose-MATH', teacherId: 'EMP-002', roomId: '201', day: 'Wednesday', slotId: '0900' },
  { yearId: '2026', sectionId: 'rose', subjectId: 'rose-SCI', teacherId: 'EMP-004', roomId: 'lab', day: 'Thursday', slotId: '1300' },
  { yearId: '2026', sectionId: 'lily', subjectId: 'lily-ENG', teacherId: 'EMP-001', roomId: '202', day: 'Tuesday', slotId: '0730' }
];
