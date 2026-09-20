// =============================================================================
// MOCK DATA - src/data/mockStudents.js
// =============================================================================
// This file contains all mock student data used while MySQL is not yet connected.
//
// TODO: Replace mock data with API requests to Python backend.
// Future endpoints:
//   GET  http://localhost:8000/api/students
//   POST http://localhost:8000/api/students
//   PUT  http://localhost:8000/api/students/{id}
//   DELETE http://localhost:8000/api/students/{id}
// =============================================================================

export const BRANCHES = ['AI&DS', 'CSE', 'IT', 'ECE', 'Mechanical'];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function getStatus(marks, attendance) {
  if (marks >= 85 && attendance >= 90) return 'Excellent';
  if (marks >= 70 && attendance >= 75) return 'Good';
  if (marks >= 55 && attendance >= 60) return 'Average';
  return 'Needs Attention';
}

export const INITIAL_STUDENTS = [
  { id: 1,  name: 'Rahul Sharma',     branch: 'AI&DS',      semester: 3, marks: 82, attendance: 91 },
  { id: 2,  name: 'Priya Patil',      branch: 'CSE',        semester: 3, marks: 76, attendance: 85 },
  { id: 3,  name: 'Amit Kumar',       branch: 'AI&DS',      semester: 3, marks: 91, attendance: 94 },
  { id: 4,  name: 'Sneha Joshi',      branch: 'IT',         semester: 3, marks: 68, attendance: 72 },
  { id: 5,  name: 'Akash More',       branch: 'ECE',        semester: 3, marks: 55, attendance: 61 },
  { id: 6,  name: 'Pooja Desai',      branch: 'CSE',        semester: 4, marks: 88, attendance: 93 },
  { id: 7,  name: 'Vishal Rao',       branch: 'Mechanical', semester: 2, marks: 63, attendance: 70 },
  { id: 8,  name: 'Neha Singh',       branch: 'AI&DS',      semester: 5, marks: 79, attendance: 88 },
  { id: 9,  name: 'Rohan Gupta',      branch: 'ECE',        semester: 4, marks: 72, attendance: 80 },
  { id: 10, name: 'Anjali Mehta',     branch: 'IT',         semester: 3, marks: 84, attendance: 89 },
  { id: 11, name: 'Suresh Nair',      branch: 'Mechanical', semester: 6, marks: 58, attendance: 65 },
  { id: 12, name: 'Kavya Iyer',       branch: 'CSE',        semester: 2, marks: 96, attendance: 97 },
  { id: 13, name: 'Deepak Verma',     branch: 'AI&DS',      semester: 4, marks: 73, attendance: 82 },
  { id: 14, name: 'Ritu Agarwal',     branch: 'IT',         semester: 5, marks: 89, attendance: 92 },
  { id: 15, name: 'Manish Tiwari',    branch: 'ECE',        semester: 3, marks: 47, attendance: 58 },
  { id: 16, name: 'Shruti Kulkarni',  branch: 'CSE',        semester: 6, marks: 81, attendance: 87 },
  { id: 17, name: 'Arjun Pillai',     branch: 'Mechanical', semester: 4, marks: 66, attendance: 74 },
  { id: 18, name: 'Divya Reddy',      branch: 'AI&DS',      semester: 2, marks: 93, attendance: 96 },
  { id: 19, name: 'Karan Malhotra',   branch: 'ECE',        semester: 5, marks: 77, attendance: 83 },
  { id: 20, name: 'Swati Bose',       branch: 'IT',         semester: 4, marks: 62, attendance: 69 },
  { id: 21, name: 'Nikhil Pandey',    branch: 'CSE',        semester: 3, marks: 85, attendance: 90 },
  { id: 22, name: 'Ananya Chatterjee',branch: 'AI&DS',      semester: 6, marks: 78, attendance: 86 },
  { id: 23, name: 'Harsh Srivastava', branch: 'Mechanical', semester: 3, marks: 54, attendance: 63 },
  { id: 24, name: 'Meera Krishnan',   branch: 'ECE',        semester: 4, marks: 87, attendance: 91 },
  { id: 25, name: 'Tushar Bhatt',     branch: 'IT',         semester: 5, marks: 71, attendance: 78 },
  { id: 26, name: 'Sonal Pawar',      branch: 'CSE',        semester: 4, marks: 90, attendance: 95 },
  { id: 27, name: 'Vikram Chauhan',   branch: 'AI&DS',      semester: 3, marks: 65, attendance: 73 },
  { id: 28, name: 'Preeti Saxena',    branch: 'Mechanical', semester: 5, marks: 59, attendance: 67 },
  { id: 29, name: 'Aditya Jain',      branch: 'ECE',        semester: 6, marks: 83, attendance: 88 },
  { id: 30, name: 'Bhavna Shah',      branch: 'IT',         semester: 3, marks: 74, attendance: 81 },
].map(s => ({ ...s, status: getStatus(s.marks, s.attendance) }));

// Mock activity log for Database Changes page
export const INITIAL_ACTIVITY = [
  {
    id: 1,
    type: 'added',
    title: 'Student Added',
    description: "Sneha Joshi was added to the database",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 2,
    type: 'updated',
    title: 'Student Updated',
    description: "Rahul Sharma's marks changed from 78 to 82",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 3,
    type: 'deleted',
    title: 'Student Deleted',
    description: "Student ID 15 was removed from the database",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 4,
    type: 'updated',
    title: 'Student Updated',
    description: "Kavya Iyer's attendance updated from 94% to 97%",
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
  },
  {
    id: 5,
    type: 'added',
    title: 'Student Added',
    description: "Bhavna Shah was added to the database",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: 6,
    type: 'deleted',
    title: 'Student Deleted',
    description: "Student ID 8 was removed from the database",
    timestamp: new Date(Date.now() - 40 * 60 * 1000),
  },
  {
    id: 7,
    type: 'updated',
    title: 'Student Updated',
    description: "Pooja Desai's semester updated from 3 to 4",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
];

// Compute analytics from student array
export function computeAnalytics(students) {
  if (!students.length) return {};

  const total = students.length;
  const avgMarks = (students.reduce((s, st) => s + st.marks, 0) / total).toFixed(1);
  const avgAttendance = (students.reduce((s, st) => s + st.attendance, 0) / total).toFixed(1);
  const highestMarks = Math.max(...students.map(s => s.marks));
  const lowestMarks = Math.min(...students.map(s => s.marks));

  const branchStats = BRANCHES.map(branch => {
    const branchStudents = students.filter(s => s.branch === branch);
    return {
      branch,
      count: branchStudents.length,
      avgMarks: branchStudents.length
        ? (branchStudents.reduce((sum, s) => sum + s.marks, 0) / branchStudents.length).toFixed(1)
        : 0,
      avgAttendance: branchStudents.length
        ? (branchStudents.reduce((sum, s) => sum + s.attendance, 0) / branchStudents.length).toFixed(1)
        : 0,
    };
  });

  // Marks distribution buckets
  const marksDistribution = [
    { range: '0–40',   count: students.filter(s => s.marks <= 40).length },
    { range: '41–50',  count: students.filter(s => s.marks >= 41 && s.marks <= 50).length },
    { range: '51–60',  count: students.filter(s => s.marks >= 51 && s.marks <= 60).length },
    { range: '61–70',  count: students.filter(s => s.marks >= 61 && s.marks <= 70).length },
    { range: '71–80',  count: students.filter(s => s.marks >= 71 && s.marks <= 80).length },
    { range: '81–90',  count: students.filter(s => s.marks >= 81 && s.marks <= 90).length },
    { range: '91–100', count: students.filter(s => s.marks >= 91).length },
  ];

  // Attendance distribution buckets
  const attendanceDistribution = [
    { range: 'Below 60%', count: students.filter(s => s.attendance < 60).length },
    { range: '60–75%',    count: students.filter(s => s.attendance >= 60 && s.attendance <= 75).length },
    { range: '76–85%',    count: students.filter(s => s.attendance >= 76 && s.attendance <= 85).length },
    { range: '86–95%',    count: students.filter(s => s.attendance >= 86 && s.attendance <= 95).length },
    { range: 'Above 95%', count: students.filter(s => s.attendance > 95).length },
  ];

  return { total, avgMarks, avgAttendance, highestMarks, lowestMarks, branchStats, marksDistribution, attendanceDistribution };
}
