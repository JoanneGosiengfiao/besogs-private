import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import Swal from "sweetalert2";

@Component({
  selector: 'app-sched-setup',
  templateUrl: './sched-setup.component.html',
  styleUrls: ['./sched-setup.component.scss']
})
export class SchedSetupComponent implements OnInit {

  @ViewChild('modalTime', { static: false }) modalTime;

  constructor(public dialog: MatDialog) { }

  storageKey = 'grade-schedule-v2';

  // school years shown in the dropdown; only seedYear gets the mock data
  schoolYears = ['2025-2026', '2026-2027', '2027-2028'];
  seedYear = '2026-2027';
  schoolYear = '2026-2027';

  departments = [
    { id: 'ELEM', name: 'Elementary', label: 'Pre-School to Grade 6' },
    { id: 'JHS', name: 'Junior High School', label: 'Grades 7–10' },
    { id: 'SHS', name: 'Senior High School', label: 'Grades 11–12' }
  ];

  days = [
    { id: 'MON', name: 'Monday' },
    { id: 'TUE', name: 'Tuesday' },
    { id: 'WED', name: 'Wednesday' },
    { id: 'THU', name: 'Thursday' },
    { id: 'FRI', name: 'Friday' }
  ];

  // edit this list to match the strands your school offers
  strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts and Design', 'Sports'];

  grades: any[] = [];
  activeDept = 'ELEM';

  // which section / strand each grade card is showing, keyed by grade badge
  selected = {};
  selectedStrand = {};

  // which day tab is open on each grade card, keyed by grade badge
  dayIndex = {};

  selectedDayIndex(grade: any): number {
    return grade && this.dayIndex ? this.dayIndex[grade.badge] || 0 : 0;
  }

  selectDayIndex(grade: any, index: number): void {
    if (!grade || index < 0 || index >= this.days.length) return;
    if (!this.dayIndex) this.dayIndex = {};
    this.dayIndex[grade.badge] = index;
  }

  // loader per grade card while switching section / strand
  loading = {};
  loadingTimers = {};

  dialogRef;
  activeGrade = null;
  activeSection = null;
  activeDay = 'MON';
  editIndex = -1;
  start = '';
  end = '';
  isBreak = false;
  error = '';

  // sections chosen in the add / edit modal
  applySections = [];

  // day ids chosen in the add / edit modal
  applyDays = [];

  ngOnInit() {
    this.loadYear();
  }

  // ---------- school year ----------
  yearKey() {
    return this.storageKey + '-' + this.schoolYear;
  }

  selectYear(year: string) {
    this.schoolYear = year;
    this.loadYear();
  }

  loadYear() {
    this.selected = {};
    this.selectedStrand = {};
    this.dayIndex = {};
    this.loading = {};

    let saved = localStorage.getItem(this.yearKey());

    // data saved before school years existed belongs to the seed year
    if (!saved && this.schoolYear === this.seedYear) {
      saved = localStorage.getItem(this.storageKey);
    }

    if (saved) {
      this.grades = JSON.parse(saved);
      this.toSections();
      this.saveToStorage();
      return;
    }

    if (this.schoolYear === this.seedYear) {
      this.grades = this.defaultGrades();
      this.saveToStorage();
      return;
    }

    // no data for this school year; replace with your API call later
    this.grades = [];
  }

  // ---------- mock data ----------
  // [start, end, true] = break; Friday is empty everywhere
  toBlocks(list: any[]) {
    return list.map(r => ({ start: r[0], end: r[1], isBreak: !!r[2] }));
  }

  // same times Monday to Thursday
  monThu(list: any[]) {
    const blocks = this.toBlocks(list);
    return this.makeDays(blocks, blocks, blocks, blocks, []);
  }

  // pattern a on Mon/Wed, pattern b on Tue/Thu
  alternate(a: any[], b: any[]) {
    const x = this.toBlocks(a);
    const y = this.toBlocks(b);
    return this.makeDays(x, y, x, y, []);
  }

  defaultGrades() {
    const elemA = [
      ['07:15', '08:15'], ['08:15', '08:45'], ['08:15', '08:45', true],
      ['08:45', '09:45'], ['10:45', '11:45'], ['11:45', '12:45', true],
      ['12:45', '13:45'], ['13:45', '14:45'], ['14:45', '15:45']
    ];
    const elemB = [
      ['07:45', '08:45'], ['08:45', '09:15'], ['08:45', '09:15', true],
      ['09:15', '10:15'], ['11:15', '12:15'], ['12:15', '13:15', true],
      ['13:15', '14:15'], ['14:15', '15:15'], ['15:15', '16:15']
    ];
    const jhsA = elemA.concat([['15:45', '16:45']]);
    const jhsB = elemB.concat([['16:15', '17:15']]);
    const jhsC = [
      ['08:15', '09:15'], ['09:15', '09:45'], ['09:15', '09:45', true],
      ['09:45', '10:45'], ['11:45', '12:45'], ['12:45', '13:45', true],
      ['13:45', '14:45'], ['14:45', '15:45'], ['15:45', '16:45'], ['16:45', '17:45']
    ];
    const upperA = [
      ['07:15', '08:15'], ['08:15', '09:15'], ['09:15', '09:45', true],
      ['09:45', '10:45'], ['10:45', '11:45'], ['11:45', '12:45', true],
      ['12:45', '13:45'], ['13:45', '14:45'], ['14:45', '15:45'], ['15:45', '16:45']
    ];
    const upperB = [
      ['07:45', '08:45'], ['08:45', '09:45'], ['09:45', '10:15', true],
      ['10:15', '11:15'], ['11:15', '12:15'], ['12:15', '13:15', true],
      ['13:15', '14:15'], ['14:15', '15:15'], ['15:15', '16:15'], ['16:15', '17:15']
    ];

    // Grade 11: long blocks on Mon/Wed, regular periods on Tue/Thu
    const stemAlong = [['07:45', '09:15'], ['09:15', '10:45'], ['10:45', '12:15'], ['12:15', '13:45'], ['13:45', '15:15'], ['15:15', '16:45']];
    const stemAshort = [['07:15', '08:15'], ['08:15', '09:15'], ['09:15', '09:45', true], ['09:45', '10:45'], ['10:45', '11:45'], ['13:15', '14:15'], ['15:15', '16:15']];
    const stemBlong = [['08:15', '09:45'], ['09:45', '11:15'], ['11:15', '12:45'], ['12:45', '14:15'], ['14:15', '15:45'], ['15:45', '17:15']];
    const stemBshort = [['07:45', '08:45'], ['08:45', '09:45'], ['09:45', '10:15', true], ['10:15', '11:15'], ['11:15', '12:15'], ['13:45', '14:45'], ['15:45', '16:45']];
    const abmLong = [['08:00', '09:30'], ['09:30', '11:00'], ['11:00', '12:30'], ['12:30', '14:00'], ['14:00', '15:30'], ['15:30', '17:00']];
    const abmShort = [['07:30', '08:30'], ['08:30', '09:30'], ['09:30', '10:00', true], ['10:00', '11:00'], ['11:00', '12:00'], ['13:30', '14:30'], ['15:30', '16:30']];
    const humssLong = [['08:30', '10:00'], ['10:00', '11:30'], ['11:30', '13:00'], ['13:00', '14:30'], ['14:30', '16:00'], ['16:00', '17:30']];
    const humssShort = [['08:00', '09:00'], ['09:00', '10:00'], ['10:00', '10:30', true], ['10:30', '11:30'], ['11:30', '12:30'], ['14:00', '15:00'], ['16:00', '17:00']];

    // Grade 12: same times Monday to Thursday
    const g12Stem = upperB;
    const g12Abm = [
      ['08:00', '09:00'], ['09:00', '10:00'], ['10:00', '10:30', true],
      ['10:30', '11:30'], ['11:30', '12:30'], ['12:30', '13:30', true],
      ['13:30', '14:30'], ['14:30', '15:30'], ['15:30', '16:30'], ['16:30', '17:30']
    ];
    const g12Humss = [
      ['08:15', '09:15'], ['09:15', '10:15'], ['10:15', '10:45', true],
      ['10:45', '11:45'], ['11:45', '12:45'], ['12:45', '13:45', true],
      ['13:45', '14:45'], ['14:45', '15:45'], ['15:45', '16:45'], ['16:45', '17:45']
    ];
    const g12Tvl = [
      ['08:30', '09:30'], ['09:30', '10:30'], ['10:30', '11:00', true],
      ['11:00', '12:00'], ['12:00', '13:00'], ['13:00', '14:00', true],
      ['14:00', '15:00'], ['15:00', '16:00'], ['16:00', '17:00'], ['17:00', '18:00']
    ];

    return [
      {
        badge: 'P', name: 'Pre-School', dept: 'ELEM', sections: [
          {
            strand: '', name: 'Rose', blocks: this.monThu([
              ['13:00', '13:50'], ['13:50', '14:50'], ['14:50', '15:10', true],
              ['15:10', '15:30'], ['15:30', '15:50']
            ])
          }
        ]
      },
      {
        badge: 'K', name: 'Kindergarten', dept: 'ELEM', sections: [
          { strand: '', name: 'Sampaguita', blocks: this.monThu(elemA) },
          { strand: '', name: 'Rosal', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '1', name: 'Grade 1', dept: 'ELEM', sections: [
          { strand: '', name: 'Gumamela', blocks: this.monThu(elemA) },
          { strand: '', name: 'Ilang-Ilang', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '2', name: 'Grade 2', dept: 'ELEM', sections: [
          { strand: '', name: 'Dahlia', blocks: this.monThu(elemA) },
          { strand: '', name: 'Orchid', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '3', name: 'Grade 3', dept: 'ELEM', sections: [
          { strand: '', name: 'Mabini', blocks: this.monThu(elemA) },
          { strand: '', name: 'Bonifacio', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '4', name: 'Grade 4', dept: 'ELEM', sections: [
          { strand: '', name: 'Luna', blocks: this.monThu(elemA) },
          { strand: '', name: 'Silang', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '5', name: 'Grade 5', dept: 'ELEM', sections: [
          { strand: '', name: 'Jacinto', blocks: this.monThu(elemA) },
          { strand: '', name: 'Aquino', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '6', name: 'Grade 6', dept: 'ELEM', sections: [
          { strand: '', name: 'Del Pilar', blocks: this.monThu(elemA) },
          { strand: '', name: 'Ponce', blocks: this.monThu(elemB) }
        ]
      },
      {
        badge: '7', name: 'Grade 7', dept: 'JHS', sections: [
          { strand: '', name: 'Narra', blocks: this.monThu(jhsA) },
          { strand: '', name: 'Molave', blocks: this.monThu(jhsB) },
          { strand: '', name: 'Acacia', blocks: this.monThu(jhsC) }
        ]
      },
      {
        badge: '8', name: 'Grade 8', dept: 'JHS', sections: [
          { strand: '', name: 'Yakal', blocks: this.monThu(jhsA) },
          { strand: '', name: 'Mahogany', blocks: this.monThu(jhsB) }
        ]
      },
      {
        badge: '9', name: 'Grade 9', dept: 'JHS', sections: [
          { strand: '', name: 'Apitong', blocks: this.monThu(upperA) },
          { strand: '', name: 'Kamagong', blocks: this.monThu(upperB) }
        ]
      },
      {
        badge: '10', name: 'Grade 10', dept: 'JHS', sections: [
          { strand: '', name: 'Lauan', blocks: this.monThu(upperA) },
          { strand: '', name: 'Banaba', blocks: this.monThu(upperB) }
        ]
      },
      {
        badge: '11', name: 'Grade 11', dept: 'SHS', sections: [
          { strand: 'STEM', name: 'Set A', blocks: this.alternate(stemAlong, stemAshort) },
          { strand: 'STEM', name: 'Set B', blocks: this.alternate(stemBlong, stemBshort) },
          { strand: 'ABM', name: 'Set A', blocks: this.alternate(abmLong, abmShort) },
          { strand: 'HUMSS', name: 'Set A', blocks: this.alternate(humssLong, humssShort) }
        ]
      },
      {
        badge: '12', name: 'Grade 12', dept: 'SHS', sections: [
          { strand: 'STEM', name: 'Set A', blocks: this.monThu(g12Stem) },
          { strand: 'ABM', name: 'Set A', blocks: this.monThu(g12Abm) },
          { strand: 'HUMSS', name: 'Set A', blocks: this.monThu(g12Humss) },
          { strand: 'TVL', name: 'Set A', blocks: this.monThu(g12Tvl) }
        ]
      }
    ];
  }

  // converts old saved data (grade.blocks) into one section per grade, keeping its times
  toSections() {
    let changed = false;
    this.grades.forEach(g => {
      if (!g.sections) {
        const isShs = g.dept === 'SHS';
        g.sections = [{
          strand: isShs ? this.strands[0] : '',
          name: isShs ? 'Set A' : 'Section A',
          blocks: g.blocks || this.makeWeek([])
        }];
        delete g.blocks;
        changed = true;
      }
    });
    if (changed) {
      this.saveToStorage();
    }
  }

  copyBlocks(blocks: any[]) {
    return blocks.map(b => ({ start: b.start, end: b.end, isBreak: !!b.isBreak }));
  }

  // builds { MON: [...], ..., FRI: [...] } with a separate copy for each day
  makeDays(mon: any[], tue: any[], wed: any[], thu: any[], fri: any[]) {
    return {
      MON: this.copyBlocks(mon),
      TUE: this.copyBlocks(tue),
      WED: this.copyBlocks(wed),
      THU: this.copyBlocks(thu),
      FRI: this.copyBlocks(fri)
    };
  }

  // same times on every day
  makeWeek(blocks: any[]) {
    return this.makeDays(blocks, blocks, blocks, blocks, blocks);
  }

  saveToStorage() {
    localStorage.setItem(this.yearKey(), JSON.stringify(this.grades));
  }

  // ---------- display ----------
  gradesFor(dept: string) {
    return this.grades.filter(g => g.dept === dept);
  }

  activeDepartment() {
    return this.departments.find(d => d.id === this.activeDept);
  }

  isShs(grade: any) {
    return !!grade && grade.dept === 'SHS';
  }

  // "Section" for Elementary and JHS, "Set" for SHS
  sectionLabel(grade: any) {
    return this.isShs(grade) ? 'Set' : 'Section';
  }

  allLabel(grade: any) {
    return this.isShs(grade) ? 'All sets' : 'All sections';
  }

  sectionSummary(grade: any) {
    const count = grade.sections.length;
    const label = this.sectionLabel(grade).toLowerCase() + (count === 1 ? '' : 's');
    return count + ' ' + label;
  }

  dayName(id: string) {
    const day = this.days.find(d => d.id === id);
    return day ? day.name : '';
  }

  formatTime(time: string) {
    const parts = time.split(':').map(Number);
    const h = parts[0];
    const m = parts[1];
    return (h % 12 || 12) + ':' + (m < 10 ? '0' + m : m) + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  // ---------- sections ----------
  // SHS: strand shown in the strand dropdown (defaults to the first set's strand)
  shownStrand(grade: any) {
    if (this.selectedStrand[grade.badge]) return this.selectedStrand[grade.badge];
    return grade.sections.length ? grade.sections[0].strand : this.strands[0];
  }

  // sections listed in the section dropdown (SHS: only the sets of the shown strand)
  visibleSections(grade: any) {
    if (!grade) return [];
    if (!this.isShs(grade)) return grade.sections;
    const strand = this.shownStrand(grade);
    return grade.sections.filter(s => s.strand === strand);
  }

  // the one section whose times the card displays
  currentSection(grade: any) {
    const list = this.visibleSections(grade);
    const sel = this.selected[grade.badge];
    return list.indexOf(sel) > -1 ? sel : list[0];
  }

  selectSection(grade: any, section: any) {
    this.selected[grade.badge] = section;
    this.showLoader(grade);
  }

  selectStrand(grade: any, strand: string) {
    this.selectedStrand[grade.badge] = strand;
    this.selected[grade.badge] = null;
    this.showLoader(grade);
  }

  // shows the loader on one grade card; replace the timeout with your API call later
  showLoader(grade: any) {
    clearTimeout(this.loadingTimers[grade.badge]);
    this.loading[grade.badge] = true;
    this.loadingTimers[grade.badge] = setTimeout(() => {
      this.loading[grade.badge] = false;
    }, 500);
  }

  // ---------- modal ----------
  openModalTime() {
    this.dialogRef = this.dialog.open(this.modalTime, {
      width: '500px',
      height: 'auto',
      autoFocus: false
    });
  }

  // "Add time" in the grade head: uses the day tab that is currently open
  addTime(grade: any) {
    const section = this.currentSection(grade);
    if (!section) return;
    this.openAdd(grade, section, this.days[this.selectedDayIndex(grade)].id);
  }

  openAdd(grade: any, section: any, day: string) {
    this.activeGrade = grade;
    this.activeSection = section;
    this.activeDay = day;
    this.applySections = [section];
    this.applyDays = [day];
    this.editIndex = -1;
    this.start = '';
    this.end = '';
    this.isBreak = false;
    this.error = '';
    this.openModalTime();
  }

  openEdit(grade: any, section: any, day: string, index: number) {
    this.activeGrade = grade;
    this.activeSection = section;
    this.activeDay = day;
    this.applySections = [section];
    this.applyDays = [day];
    this.editIndex = index;
    this.start = section.blocks[day][index].start;
    this.end = section.blocks[day][index].end;
    this.isBreak = !!section.blocks[day][index].isBreak;
    this.error = '';
    this.openModalTime();
  }

  closeModal() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  // ---------- section picker ----------
  hasSection(section: any) {
    return this.applySections.indexOf(section) > -1;
  }

  toggleSection(section: any, checked: boolean) {
    this.applySections = this.applySections.filter(s => s !== section);
    if (checked) this.applySections.push(section);
  }

  allSectionsChecked() {
    const list = this.visibleSections(this.activeGrade);
    return list.length > 0 && list.every((s: any) => this.hasSection(s));
  }

  toggleAllSections(checked: boolean) {
    this.applySections = checked ? this.visibleSections(this.activeGrade).slice() : [];
  }

  // chosen sections, in the order they are listed
  targets() {
    return this.visibleSections(this.activeGrade).filter((s: any) => this.hasSection(s));
  }

  // ---------- day picker ----------
  hasDay(id: string) {
    return this.applyDays.indexOf(id) > -1;
  }

  toggleDay(id: string, checked: boolean) {
    this.applyDays = this.applyDays.filter(d => d !== id);
    if (checked) this.applyDays.push(id);
  }

  allDaysChecked() {
    return this.applyDays.length === this.days.length;
  }

  toggleAllDays(checked: boolean) {
    this.applyDays = checked ? this.days.map(d => d.id) : [];
  }

  // true for the exact block being edited
  isEditing(section: any, day: string, index: number) {
    return this.editIndex !== -1 && section === this.activeSection && day === this.activeDay && index === this.editIndex;
  }

  // ---------- CRUD ----------
  saveTime() {
    if (!this.start || !this.end) {
      Swal.fire(
        "Invalid time",
        "Enter a start and end time",
        "info"
      );
      return;
    }
    if (this.start >= this.end) {
      Swal.fire(
        "Invalid time",
        "End time must be after start time",
        "info"
      );
      return;
    }
    if (!this.applyDays.length) {
      Swal.fire(
        "",
        "Select at least one day",
        "info"
      );
      return;
    }
    if (!this.targets().length) {
      Swal.fire(
        "",
        "Select at least one " + this.sectionLabel(this.activeGrade).toLowerCase(),
        "info"
      );
      return;
    }

    const targets = this.targets();
    const taken = targets.some((sec: any) =>
      this.applyDays.some((day: string) =>
        sec.blocks[day].some((b: any, i: number) =>
          !this.isEditing(sec, day, i) && this.start < b.end && b.start < this.end
        )
      )
    );
    if (taken) {
      Swal.fire(
        "",
        "This time is already added or overlaps another time in the selected " + this.sectionLabel(this.activeGrade).toLowerCase() + " / day",
        "info"
      );
      return;
    }

    targets.forEach((sec: any) => {
      this.applyDays.forEach((day: string) => {
        const blocks = sec.blocks[day];
        const block = { start: this.start, end: this.end, isBreak: this.isBreak };

        if (this.isEditing(sec, day, this.editIndex)) {
          blocks[this.editIndex] = block;
        } else {
          blocks.push(block);
        }
        blocks.sort((a: any, b: any) => a.start.localeCompare(b.start));
      });
    });

    this.saveToStorage();
    this.closeModal();
  }

  removeTime(section: any, day: string, index: number) {
    if (!confirm('Remove this time?')) return;
    section.blocks[day].splice(index, 1);
    this.saveToStorage();
  }
}
