import Swal from 'sweetalert2';
import { PlotScheduleComponent } from './plot-schedule.component';

describe('PlotScheduleComponent mock scheduling', () => {
  let component: PlotScheduleComponent;
  beforeEach(() => { component = new PlotScheduleComponent(); spyOn(Swal, 'fire'); });

  it('starts in the latest year and keeps carousel navigation within bounds', () => {
    expect(component.yearId).toBe('2026');
    component.moveSection(-1);
    expect(component.sectionId).toBe('rose');
    component.selectSection('jasmine');
    component.moveSection(1);
    expect(component.sectionId).toBe('jasmine');
    expect(component.visibleSections[1].id).toBe('jasmine');
  });

  it('shows a warning when weekly hours would be exceeded', () => {
    component.selectSubject(component.subjects[0]);
    component.assign('Friday', '0900');
    component.assign('Friday', '1030');
    const count = component.assignments.length;
    component.assign('Friday', '1300');
    expect(component.assignments.length).toBe(count);
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'warning', title: 'Cannot plot subject' }));
    expect(component.message).toContain('Weekly hours exceeded');
  });

  it('requires a subject and prevents overwriting occupied slots', () => {
    const count = component.assignments.length;
    component.assign('Friday', '1600');
    expect(component.message).toContain('Select a subject');
    component.selectSubject(component.subjects[0]);
    component.assign('Monday', '0730');
    expect(component.conflict).toBe('section');
    expect(component.assignments.length).toBe(count);
  });

  it('adds repeated subjects, preserves them across sections, and removes an assignment', () => {
    component.selectSubject(component.subjects[0]);
    component.assign('Friday', '1430');
    component.assign('Friday', '1600');
    const assignment = component.assignmentAt('Friday', '1600');
    expect(assignment.subjectId).toBe('rose-ENG');
    component.selectSection('lily');
    expect(component.selectedSubject).toBeNull();
    component.selectSection('rose');
    expect(component.assignmentAt('Friday', '1600')).toBe(assignment);
    component.remove(assignment);
    expect(component.assignmentAt('Friday', '1600')).toBeUndefined();
    expect(component.assignmentAt('Friday', '1430')).toBeDefined();
  });

  it('rejects teacher conflicts across sections even with a different room', () => {
    component.selectSubject(component.subjects[0]);
    component.assign('Tuesday', '0730');
    expect(component.conflict).toBe('teacher');
    expect(component.message).toContain('Lily');
    expect(component.assignmentAt('Tuesday', '0730')).toBeUndefined();
  });

  it('rejects room conflicts with different teachers and allows another room', () => {
    component.selectSubject(component.subjects[1]);
    component.roomId = '202';
    component.assign('Tuesday', '0730');
    expect(component.conflict).toBe('room');
    component.roomId = '201';
    component.assign('Tuesday', '0730');
    expect(component.conflict).toBeNull();
    expect(component.assignmentAt('Tuesday', '0730')).toBeDefined();
  });

  it('isolates years and restores existing schedules when switching back', () => {
    component.changeYear('2025');
    expect(component.sectionId).toBe('rose-2025');
    component.selectSubject(component.subjects[0]);
    component.assign('Monday', '0730');
    expect(component.conflict).toBeNull();
    expect(component.assignmentAt('Monday', '0730').yearId).toBe('2025');
    component.changeYear('2026');
    expect(component.selectedSubject).toBeNull();
    expect(component.assignmentAt('Monday', '0730').yearId).toBe('2026');
  });

  it('handles years without sections and sections without subjects', () => {
    component.selectSection('jasmine');
    expect(component.subjects.length).toBe(0);
    component.changeYear('2024');
    expect(component.section).toBeUndefined();
    expect(component.visibleSections.length).toBe(0);
    const count = component.assignments.length;
    component.assign('Monday', '0730');
    expect(component.assignments.length).toBe(count);
  });
});
