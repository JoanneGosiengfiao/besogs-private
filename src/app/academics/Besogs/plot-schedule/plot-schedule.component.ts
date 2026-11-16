import Swal from 'sweetalert2';
import { trigger, transition, style, animate } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { SCHOOL_YEARS, SECTIONS, SUBJECTS, ROOMS, DAYS, TIME_SLOTS, ASSIGNMENTS,
  ScheduleAssignment, ScheduleSection, ScheduleSubject } from './plot-schedule.mock';

@Component({
  selector: 'app-plot-schedule',
  animations: [trigger('sectionChange', [
    // Do not animate insertion/removal: Angular would retain the leaving schedule
    // while the empty state is already visible, causing a flash and layout jump.
    transition((fromState, toState) => fromState !== 'void' && toState !== 'void' && fromState !== toState,
      [style({ opacity: 0.4, transform: 'translateX(10px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))])
  ])],
  templateUrl: './plot-schedule.component.html',
  styleUrls: ['./plot-schedule.component.scss']
})
export class PlotScheduleComponent implements OnDestroy {
  loadingSection = false;
  private sectionLoadTimer: ReturnType<typeof setTimeout>;

  requestSection(id: string): void {
    if (this.loadingSection || id === this.sectionId) { return; }
    this.loadingSection = true;
    this.sectionLoadTimer = setTimeout(() => {
      this.selectSection(id);
      this.loadingSection = false;
    }, 700);
  }

  ngOnDestroy(): void { clearTimeout(this.sectionLoadTimer); }

  readonly schoolYears = SCHOOL_YEARS;
  readonly rooms = ROOMS;
  readonly days = DAYS;
  readonly timeSlots = TIME_SLOTS;
  yearId = SCHOOL_YEARS[0].id;
  sectionId = SECTIONS[0].id;
  roomId = ROOMS[0].id;
  selectedSubject: ScheduleSubject = null;
  showIncompletePlotting = false;

  get visibleSubjects(): ScheduleSubject[] {
    return this.showIncompletePlotting
      ? this.subjects.filter(subject => this.plottedHours(subject) < subject.hours)
      : this.subjects;
  }

  toggleIncompletePlotting(checked: boolean): void {
    this.showIncompletePlotting = checked;
    this.clearHiddenSubject();
  }

  private clearHiddenSubject(): void {
    if (this.showIncompletePlotting && this.selectedSubject &&
        this.plottedHours(this.selectedSubject) >= this.selectedSubject.hours) {
      this.selectedSubject = null;
    }
  }
  assignments: ScheduleAssignment[] = ASSIGNMENTS.map(item => ({ ...item }));
  message = '';
  conflict: 'section' | 'teacher' | 'room' | null = null;

  get sections(): ScheduleSection[] { return SECTIONS.filter(item => item.yearId === this.yearId); }
  get section(): ScheduleSection { return this.sections.find(item => item.id === this.sectionId); }
  get sectionIndex(): number { return this.sections.findIndex(item => item.id === this.sectionId); }
  get visibleSections(): (ScheduleSection | null)[] {
    const index = this.sectionIndex;
    return this.section ? [this.sections[index - 1] || null, this.section, this.sections[index + 1] || null] : [];
  }
  get subjects(): ScheduleSubject[] { return SUBJECTS.filter(item => item.sectionId === this.sectionId); }
  get sectionAssignments(): ScheduleAssignment[] {
    return this.assignments.filter(item => item.yearId === this.yearId && item.sectionId === this.sectionId);
  }
  changeYear(id: string): void {
    if (this.loadingSection) { return; }
    this.yearId = id;
    this.selectSection(this.sections.length ? this.sections[0].id : null);
  }
  selectSection(id: string): void {
    this.sectionId = id;
    this.selectedSubject = null;
    this.clearFeedback();
  }
  moveSection(offset: number): void {
    if (this.loadingSection) { return; }
    const next = this.sections[this.sectionIndex + offset];
    if (next) { this.requestSection(next.id); }
  }
  selectSubject(subject: ScheduleSubject): void { this.selectedSubject = subject; this.clearFeedback(); }
  plottedHours(subject: ScheduleSubject): number {
    return this.sectionAssignments.filter(item => item.subjectId === subject.id).length * 1.5;
  }
  clearFeedback(): void { this.message = ''; this.conflict = null; }
  assignmentAt(day: string, slotId: string): ScheduleAssignment {
    return this.sectionAssignments.find(item => item.day === day && item.slotId === slotId);
  }
  subjectFor(assignment: ScheduleAssignment): ScheduleSubject { return SUBJECTS.find(item => item.id === assignment.subjectId); }
  roomName(id: string): string { const room = this.rooms.find(item => item.id === id); return room ? room.name : id; }
  showMockAction(action: 'Save' | 'Print'): void {
    Swal.fire({ title: action + ' schedule', type: 'info',
      text: 'This is a mock schedule. ' + action + ' is not connected yet.',
      confirmButtonColor: '#294a70' });
  }
  private showPlotWarning(): void {
    Swal.fire({ title: 'Cannot plot subject', text: this.message, type: 'warning',
      confirmButtonText: 'OK', confirmButtonColor: '#294a70' });
  }
  assign(day: string, slotId: string): void {
    this.clearFeedback();
    if (!this.section) { return; }
    if (this.assignmentAt(day, slotId)) {
      this.conflict = 'section'; this.message = 'This section already has a subject in this slot. Remove it first.'; this.showPlotWarning(); return;
    }
    if (!this.selectedSubject || !this.subjects.some(item => item.id === this.selectedSubject.id)) {
      this.message = 'Select a subject on the left before choosing a time slot.'; this.showPlotWarning(); return;
    }
    if (this.plottedHours(this.selectedSubject) + 1.5 > this.selectedSubject.hours) {
      this.message = 'Weekly hours exceeded. Each slot uses 1.5 hours; ' + (this.selectedSubject.hours - this.plottedHours(this.selectedSubject)) + ' hours remain for this subject.'; this.showPlotWarning(); return;
    }
    if (!this.rooms.some(item => item.id === this.roomId)) { this.message = 'Choose a room first.'; this.showPlotWarning(); return; }
    const simultaneous = this.assignments.filter(item => item.yearId === this.yearId && item.day === day && item.slotId === slotId);
    const teacherConflict = simultaneous.find(item => item.teacherId === this.selectedSubject.teacherId);
    const roomConflict = simultaneous.find(item => item.roomId === this.roomId);
    if (teacherConflict || roomConflict) {
      this.conflict = teacherConflict ? 'teacher' : 'room';
      const other = SECTIONS.find(item => item.id === (teacherConflict || roomConflict).sectionId);
      this.message = (teacherConflict ? this.selectedSubject.teacher : this.roomName(this.roomId)) +
        ' is already assigned to ' + other.level + ' – ' + other.name + ' at this time.';
      this.showPlotWarning();
      return;
    }
    this.assignments = [...this.assignments, { yearId: this.yearId, sectionId: this.sectionId,
      subjectId: this.selectedSubject.id, teacherId: this.selectedSubject.teacherId, roomId: this.roomId, day, slotId }];
    this.message = this.selectedSubject.title + ' assigned on ' + day + '.';
    this.clearHiddenSubject();
  }
  remove(assignment: ScheduleAssignment): void {
    this.assignments = this.assignments.filter(item => item !== assignment);
    this.clearFeedback();
    this.message = 'Assignment removed. This slot is available again.';
  }
}

