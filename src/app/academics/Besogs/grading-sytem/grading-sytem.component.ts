import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-grading-sytem',
  templateUrl: './grading-sytem.component.html',
  styleUrls: ['./grading-sytem.component.scss']
})
export class GradingSytemComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
schoolYears = ['2025-2026', '2024-2025'];
 
  terms = ['1st Term', '2nd Term', '3rd Term', '4th Term'];
 
  // one row = one section teaching one subject in one school year
  classes = [
    { id: 1, schoolYear: '2025-2026', section: 'Rose', subject: 'Filipino', level: 'Grade 7' },
    { id: 2, schoolYear: '2025-2026', section: 'Rose', subject: 'Mathematics', level: 'Grade 7' },
    { id: 3, schoolYear: '2025-2026', section: 'Rose', subject: 'English', level: 'Grade 7' },
    { id: 4, schoolYear: '2025-2026', section: 'Tulip', subject: 'Filipino', level: 'Grade 7' },
    { id: 5, schoolYear: '2025-2026', section: 'Sampaguita', subject: 'Science', level: 'Grade 8' },
    { id: 6, schoolYear: '2024-2025', section: 'Rose', subject: 'Filipino', level: 'Grade 6' },
    { id: 7, schoolYear: '2024-2025', section: 'Orchid', subject: 'Science', level: 'Grade 6' }
  ];
 
  // students per class id
  studentsByClass = {
    1: [
      { id: 101, idNumber: '136512070001', gender: 'M', name: 'Dela Cruz, Juan A.' },
      { id: 102, idNumber: '136512070002', gender: 'F', name: 'Reyes, Maria Clara S.' },
      { id: 103, idNumber: '136512070003', gender: 'M', name: 'Santos, Jose P.' },
      { id: 104, idNumber: '136512070004', gender: 'F', name: 'Bautista, Angelica M.' },
      { id: 105, idNumber: '136512070005', gender: 'M', name: 'Mendoza, Carlo R.' },
      { id: 106, idNumber: '136512070006', gender: 'M', name: 'Villanueva, Isabel T.' }
    ],
    2: [
      { id: 101, idNumber: '136512070001', gender: 'M', name: 'Dela Cruz, Juan A.' },
      { id: 102, idNumber: '136512070002', gender: 'F', name: 'Reyes, Maria Clara S.' },
      { id: 103, idNumber: '136512070003', gender: 'M', name: 'Santos, Jose P.' },
      { id: 104, idNumber: '136512070004', gender: 'F', name: 'Bautista, Angelica M.' }
    ],
    3: [
      { id: 101, idNumber: '136512070001', gender: 'M', name: 'Dela Cruz, Juan A.' },
      { id: 102, idNumber: '136512070002', gender: 'F', name: 'Reyes, Maria Clara S.' },
      { id: 103, idNumber: '136512070003', gender: 'M', name: 'Santos, Jose P.' }
    ],
    4: [
      { id: 201, idNumber: '136512070011', gender: 'M', name: 'Garcia, Paolo L.' },
      { id: 202, idNumber: '136512070012', gender: 'F', name: 'Ramos, Katrina D.' },
      { id: 203, idNumber: '136512070013', gender: 'M', name: 'Aquino, Miguel B.' },
      { id: 204, idNumber: '136512070014', gender: 'F', name: 'Torres, Hannah C.' }
    ],
    5: [
      { id: 301, idNumber: '136512080021', gender: 'M', name: 'Navarro, Lorenzo F.' },
      { id: 302, idNumber: '136512080022', gender: 'F', name: 'Castillo, Bea N.' },
      { id: 303, idNumber: '136512080023', gender: 'M', name: 'Domingo, Rafael G.' }
    ],
    6: [
      { id: 401, idNumber: '136512060031', gender: 'F', name: 'Pascual, Elena V.' },
      { id: 402, idNumber: '136512060032', gender: 'M', name: 'Lim, Daniel K.' }
    ],
    7: [
      { id: 501, idNumber: '136512060041', gender: 'M', name: 'Soriano, Camille J.' },
      { id: 502, idNumber: '136512060042', gender: 'M', name: 'Fernandez, Nathan E.' }
    ]
  };
 
  // grades already uploaded, keyed 'schoolYear|term|classId' then by student id
  uploadedGrades = {
    '2025-2026|1st Term|1': { 101: 88, 102: 93, 103: 85, 104: 90, 105: 79, 106: 91 },
    '2025-2026|1st Term|4': { 201: 84, 202: 89 },
    '2024-2025|4th Term|6': { 401: 95, 402: 87 }
  };
 
  // ---------- selection state ----------
  selectedSchoolYear = '';
  selectedTerm = '';
  selectedClassId = '';
 
  // ---------- table state ----------
  rows = [];
  isUploading = false;
  message = '';
  minGrade = 60;
  maxGrade = 100;
 
  // ---------- selection methods ----------
  onSchoolYearChange() {
    this.selectedTerm = '';
    this.selectedClassId = '';
    this.clearRows();
  }
 
  onTermChange() {
    this.selectedClassId = '';
    this.clearRows();
  }
 
  onClassChange() {
    this.message = '';
    if (!this.selectedClassId) {
      this.clearRows();
      return;
    }
    this.loadStudents();
  }
 
  getClasses() {
    return this.classes.filter(c => c.schoolYear === this.selectedSchoolYear);
  }
 
  getSelectedClass() {
    return this.classes.find(c => c.id === +this.selectedClassId);
  }
 
  getStoreKey() {
    return this.selectedSchoolYear + '|' + this.selectedTerm + '|' + this.selectedClassId;
  }
 
  clearRows() {
    this.rows = [];
    this.message = '';
  }
 
  loadStudents() {
    const students = this.studentsByClass[this.selectedClassId] || [];
    const saved = this.uploadedGrades[this.getStoreKey()] || {};
 
    this.rows = students.map(s => {
      const hasSaved = saved[s.id] !== undefined;
      return {
        id: s.id,
        idNumber: s.idNumber,
        name: s.name,
        gender: s.gender,
        grade: hasSaved ? saved[s.id] : null,
        status: hasSaved ? 'uploaded' : 'pending'
      };
    });
  }
 
  // ---------- grade methods ----------
  onGradeInput(row) {
    // any edit means the value needs to be uploaded again
    row.status = 'pending';
    this.message = '';
  }
 
  isFilled(row) {
    return row.grade !== null && row.grade !== '' && row.grade !== undefined;
  }
 
  isValid(row) {
    if (!this.isFilled(row)) {
      return false;
    }
    const value = +row.grade;
    return !isNaN(value) && value >= this.minGrade && value <= this.maxGrade;
  }
 
  hasError(row) {
    return this.isFilled(row) && !this.isValid(row);
  }
 
  getRemarks(row) {
    if (!this.isValid(row)) {
      return '';
    }
    return +row.grade >= 75 ? 'Passed' : 'Failed';
  }
 
  countByStatus(status) {
    return this.rows.filter(r => r.status === status).length;
  }
 
  countErrors() {
    return this.rows.filter(r => this.hasError(r)).length;
  }
 
  getUploadableRows() {
    return this.rows.filter(r => this.isValid(r) && r.status !== 'uploaded');
  }
 
  canUpload() {
    return !this.isUploading && this.countErrors() === 0 && this.getUploadableRows().length > 0;
  }
 
  // ---------- upload methods (mock: replace the timeout with your API call) ----------
  uploadAll() {
    if (!this.canUpload()) {
      return;
    }
    const toUpload = this.getUploadableRows();
    this.isUploading = true;
    this.message = '';
 
    setTimeout(() => {
      const key = this.getStoreKey();
      this.uploadedGrades[key] = this.uploadedGrades[key] || {};
 
      toUpload.forEach(row => {
        this.uploadedGrades[key][row.id] = +row.grade;
        row.grade = +row.grade;
        row.status = 'uploaded';
      });
 
      this.isUploading = false;
      const cls = this.getSelectedClass();
      this.message = toUpload.length + ' grade(s) uploaded for ' + cls.section + ' - ' + cls.subject + '.';
    }, 800);
  }
}
