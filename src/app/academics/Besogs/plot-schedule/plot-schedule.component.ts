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
  selectSubject(subject: ScheduleSubject): void {
    this.selectedSubject = this.selectedSubject && this.selectedSubject.id === subject.id ? null : subject;
    this.clearFeedback();
    if (this.selectedSubject) { this.checkConflicts(); }
  }
  plottedHours(subject: ScheduleSubject): number {
    return this.sectionAssignments.filter(item => item.subjectId === subject.id).length * 1.5;
  }
  clearFeedback(): void { this.message = ''; this.conflict = null; }
  assignmentAt(day: string, slotId: string): ScheduleAssignment {
    return this.sectionAssignments.find(item => item.day === day && item.slotId === slotId);
  }
  slotUnavailableReason(day: string, slotId: string): string {
    if (!this.selectedSubject || !this.section) { return ''; }
    if (this.assignmentAt(day, slotId)) { return 'This section already has a subject in this slot.'; }
    if (this.plottedHours(this.selectedSubject) + 1.5 > this.selectedSubject.hours) {
      return 'Weekly hours exceeded. Each slot uses 1.5 hours; ' +
        (this.selectedSubject.hours - this.plottedHours(this.selectedSubject)) + ' hours remain for this subject.';
    }
    if (!this.rooms.some(item => item.id === this.roomId)) { return 'Choose a room first.'; }
    const simultaneous = this.assignments.filter(item => item.yearId === this.yearId && item.day === day && item.slotId === slotId);
    const teacherConflict = simultaneous.find(item => item.teacherId === this.selectedSubject.teacherId);
    if (teacherConflict) {
      const other = SECTIONS.find(item => item.id === teacherConflict.sectionId);
      return this.selectedSubject.teacher + ' is already assigned to ' + other.level + ' – ' + other.name + ' at this time.';
    }
    const roomConflict = simultaneous.find(item => item.roomId === this.roomId);
    if (roomConflict) {
      const other = SECTIONS.find(item => item.id === roomConflict.sectionId);
      return this.roomName(this.roomId) + ' is already assigned to ' + other.level + ' – ' + other.name + ' at this time.';
    }
    return '';
  }
  private checkConflicts(): void {
    for (const day of this.days) {
      for (const slot of this.timeSlots) {
        const reason = this.slotUnavailableReason(day, slot.id);
        if (!reason) { continue; }
        this.message = reason;
        this.conflict = this.assignmentAt(day, slot.id) ? 'section' :
          reason.indexOf(this.selectedSubject.teacher + ' is already assigned') === 0 ? 'teacher' :
          reason.indexOf(this.roomName(this.roomId) + ' is already assigned') === 0 ? 'room' : null;
        return;
      }
    }
  }
  subjectFor(assignment: ScheduleAssignment): ScheduleSubject { return SUBJECTS.find(item => item.id === assignment.subjectId); }
  roomName(id: string): string { const room = this.rooms.find(item => item.id === id); return room ? room.name : id; }
  showMockAction(): void {
    Swal.fire({ title: 'Print schedule', type: 'info',
      text: 'This is a mock schedule. Print is not connected yet.',
      confirmButtonColor: '#294a70' });
  }
  private showPlotWarning(): void {
    Swal.fire({ title: 'Cannot plot subject', text: this.message, type: 'warning',
      confirmButtonText: 'OK', confirmButtonColor: '#294a70' });
  }
  assign(day: string, slotId: string): void {
    this.clearFeedback();
    if (!this.section) { return; }
    if (!this.selectedSubject || !this.subjects.some(item => item.id === this.selectedSubject.id)) {
      this.message = 'Select a subject on the left before choosing a time slot.'; this.showPlotWarning(); return;
    }
    const reason = this.slotUnavailableReason(day, slotId);
    if (reason) {
      this.message = reason;
      this.conflict = this.assignmentAt(day, slotId) ? 'section' :
        reason.indexOf(this.selectedSubject.teacher + ' is already assigned') === 0 ? 'teacher' :
        reason.indexOf(this.roomName(this.roomId) + ' is already assigned') === 0 ? 'room' : null;
      this.showPlotWarning();
      return;
    }
    this.assignments = [...this.assignments, { yearId: this.yearId, sectionId: this.sectionId,
      subjectId: this.selectedSubject.id, teacherId: this.selectedSubject.teacherId, roomId: this.roomId, day, slotId }];
    this.message = this.selectedSubject.title + ' assigned on ' + day + '.';
    this.clearHiddenSubject();
  }
  async remove(assignment: ScheduleAssignment): Promise<void> {
    const result = await Swal.fire({
      title: 'Remove this subject?',
      text: 'This will make the time slot available again.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Keep',
      confirmButtonColor: '#294a70'
    });
    if (!result.value) { return; }
    this.assignments = this.assignments.filter(item => item !== assignment);
    this.clearFeedback();
    this.message = 'Assignment removed. This slot is available again.';
  }
}

