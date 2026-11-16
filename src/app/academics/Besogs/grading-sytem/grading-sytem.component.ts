import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import Swal from "sweetalert2";

@Component({
  selector: 'app-grading-sytem',
  templateUrl: './grading-sytem.component.html',
  styleUrls: ['./grading-sytem.component.scss']
})
export class GradingSytemComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // ---------- mock data ----------
  schoolYears = ['2025-2026', '2024-2025'];

  terms = ['1st Term', '2nd Term', '3rd Term'];

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
      { id: 106, idNumber: '136512070006', gender: 'F', name: 'Villanueva, Isabel T.' }
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
      { id: 501, idNumber: '136512060041', gender: 'F', name: 'Soriano, Camille J.' },
      { id: 502, idNumber: '136512060042', gender: 'M', name: 'Fernandez, Nathan E.' }
    ]
  };

  // saved grade sheets, keyed 'schoolYear|term|classId'
  // status 'draft' = only the teacher sees it, 'submitted' = posted to students
  gradeBatches = {
    '2025-2026|1st Term|1': {
      status: 'submitted',
      grades: { 101: 88, 102: 93, 103: 85, 104: 90, 105: 79, 106: 91 }
    },
    '2025-2026|1st Term|4': {
      status: 'draft',
      grades: { 201: 84, 202: 89 }
    },
    '2024-2025|3rd Term|6': {
      status: 'submitted',
      grades: { 401: 95, 402: 87 }
    }
  };

  // ---------- selection state ----------
  selectedSchoolYear = '';
  selectedTerm = '';
  selectedClassId = '';

  // ---------- sheet state ----------
  rows = [];
  batchStatus = 'none'; // none | draft | submitted
  hasUnsavedChanges = false;
  fileName = '';
  uploadErrors = [];
  isBusy = false;
  message = '';
  messageIsError = false;

  minGrade = 60;
  maxGrade = 100;
  passingGrade = 75;

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
    this.batchStatus = 'none';
    this.hasUnsavedChanges = false;
    this.fileName = '';
    this.uploadErrors = [];
    this.setMessage('', false);
  }

  loadStudents() {
    this.clearRows();

    const students = this.studentsByClass[this.selectedClassId] || [];
    const batch = this.gradeBatches[this.getStoreKey()];
    const saved = batch ? batch.grades : {};

    this.rows = students.map(s => {
      return {
        id: s.id,
        idNumber: s.idNumber,
        name: s.name,
        gender: s.gender,
        grade: saved[s.id] !== undefined ? saved[s.id] : null
      };
    });

    this.batchStatus = batch ? batch.status : 'none';
  }

  setMessage(text, isError) {
    this.message = text;
    this.messageIsError = isError;
  }

  getStatusLabel() {
    if (this.batchStatus === 'submitted') {
      return 'Submitted';
    }
    return this.batchStatus === 'draft' ? 'Draft' : 'Not started';
  }

  // ---------- excel: export ----------
  getSheetFileName() {
    const cls = this.getSelectedClass();
    const name = [cls.section, cls.subject, this.selectedTerm, this.selectedSchoolYear].join('_');
    return name.replace(/\s+/g, '') + '.xlsx';
  }

  exportList() {
    const data = this.rows.map((r, i) => {
      return {
        'No.': i + 1,
        'ID Number': r.idNumber,
        'Name': r.name,
        'Gender': r.gender,
        'Grade': this.isFilled(r) ? r.grade : ''
      };
    });

    const sheet = XLSX.utils.json_to_sheet(data);
    sheet['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 8 }, { wch: 10 }];

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Grades');
    XLSX.writeFile(book, this.getSheetFileName());
  }

  // ---------- excel: import ----------
  onFileSelected(event) {
    const file = event.target.files[0];
    // reset so the same file can be chosen again after a fix
    event.target.value = '';

    if (!file || this.batchStatus === 'submitted') {
      return;
    }

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      this.uploadErrors = ['Please choose an Excel file (.xlsx or .xls).'];
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const book = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array' });
        const sheet = book.Sheets[book.SheetNames[0]];
        const lines = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        this.applyUpload(lines, file.name);
      } catch (e) {
        this.fileName = '';
        this.uploadErrors = ['The file could not be read. Use the Excel list downloaded from this page.'];
      }
    };

    reader.onerror = () => {
      this.fileName = '';
      this.uploadErrors = ['The file could not be read. Please try again.'];
    };

    reader.readAsArrayBuffer(file);
  }

  applyUpload(lines, fileName) {
    const errors = [];

    if (lines.length === 0) {
      this.uploadErrors = ['The file has no rows.'];
      return;
    }

    if (!('ID Number' in lines[0]) || !('Grade' in lines[0])) {
      this.uploadErrors = ['The file needs the "ID Number" and "Grade" columns. Use the Excel list downloaded from this page.'];
      return;
    }

    const byId = {};
    this.rows.forEach(r => byId[String(r.idNumber).trim()] = r);

    // the uploaded file replaces the current grades
    this.rows.forEach(r => r.grade = null);

    const seen = {};
    let read = 0;

    lines.forEach((line, index) => {
      const idNumber = String(line['ID Number']).trim();
      const excelRow = index + 2; // row 1 is the header

      if (!idNumber) {
        return;
      }

      if (seen[idNumber]) {
        errors.push('Row ' + excelRow + ': ID ' + idNumber + ' appears more than once.');
        return;
      }
      seen[idNumber] = true;

      const row = byId[idNumber];
      if (!row) {
        errors.push('Row ' + excelRow + ': ID ' + idNumber + ' is not in this class.');
        return;
      }

      const grade = line['Grade'];
      row.grade = grade === '' ? null : grade;
      read++;
    });

    this.fileName = fileName;
    this.uploadErrors = errors;
    this.hasUnsavedChanges = true;
    this.setMessage(read + ' row(s) read from the file. Check the grades, then save as draft or submit.', false);
  }

  // ---------- grade methods ----------
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
    return +row.grade >= this.passingGrade ? 'Passed' : 'Failed';
  }

  countGraded() {
    return this.rows.filter(r => this.isValid(r)).length;
  }

  countMissing() {
    return this.rows.filter(r => !this.isFilled(r)).length;
  }

  countErrors() {
    return this.rows.filter(r => this.hasError(r)).length;
  }

  buildGrades() {
    const grades = {};
    this.rows.forEach(r => {
      if (this.isValid(r)) {
        grades[r.id] = +r.grade;
      }
    });
    return grades;
  }

  // ---------- draft and submit ----------
  canSaveDraft() {
    return !this.isBusy
      && this.batchStatus !== 'submitted'
      && this.hasUnsavedChanges
      && this.countErrors() === 0;
  }

  // every student needs a valid grade before the sheet can be posted
  canSubmit() {
    return !this.isBusy
      && this.batchStatus !== 'submitted'
      && this.rows.length > 0
      && this.countErrors() === 0
      && this.countMissing() === 0
      && (this.hasUnsavedChanges || this.batchStatus === 'draft');
  }

  // mock: replace the timeout with your API call
  // mock: replace the timeout with your API call
  saveDraft() {
    if (!this.canSaveDraft()) {
      return;
    }

    const cls = this.getSelectedClass();

    Swal.fire({
      title: 'Save as draft?',
      text: 'Grade for ' + cls.section + ' - ' + cls.subject + ' will be saved. Students cannot see it until you submit.',
      type: 'question',
      showCancelButton: true,
      confirmButtonColor: '#294a70',
      cancelButtonColor: '#d33',
      reverseButtons: true
    }).then(result => {
      if (!result.value) {
        return;
      }

      this.isBusy = true;

      setTimeout(() => {
        this.gradeBatches[this.getStoreKey()] = { status: 'draft', grades: this.buildGrades() };
        this.batchStatus = 'draft';
        this.hasUnsavedChanges = false;
        this.isBusy = false;
        this.setMessage('Draft saved. Students cannot see these grades until you submit.', false);

        Swal.fire({
          title: 'Draft saved',
          text: 'Your grades are saved. Students will see them once you submit.',
          type: 'success',
        });
      }, 600);
    });
  }

  // mock: replace the timeout with your API call
  // mock: replace the timeout with your API call
  submitGrades() {
    if (!this.canSubmit()) {
      return;
    }

    const cls = this.getSelectedClass();

    Swal.fire({
      title: 'Submit grades?',
      text: 'Grade for ' + cls.section + ' - ' + cls.subject + ' will be posted to students and locked.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#294a70',
      cancelButtonColor: '#d33',
      reverseButtons: true
    }).then(result => {
      if (!result.value) {
        return;
      }

      this.isBusy = true;

      setTimeout(() => {
        this.gradeBatches[this.getStoreKey()] = { status: 'submitted', grades: this.buildGrades() };
        this.batchStatus = 'submitted';
        this.hasUnsavedChanges = false;
        this.fileName = '';
        this.uploadErrors = [];
        this.isBusy = false;
        this.setMessage('Grades submitted and posted to students.', false);

        Swal.fire({
          title: 'Submitted',
          text: 'Grades have been posted to students.',
          type: 'success',
        });
      }, 800);
    });
  }
}