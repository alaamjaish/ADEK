import { School } from './types';

function generateCapacity(grades: string[], fillRate: number = 0.75): School['capacity'] {
  return grades.map(grade => {
    const total = Math.floor(30 * fillRate);
    const male = Math.floor(total * (0.45 + Math.random() * 0.1));
    const female = total - male;
    return {
      grade,
      maxCapacity: 30,
      currentMale: male,
      currentFemale: female,
    };
  });
}

const GRADES_KG_TO_12 = ['KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const GRADES_1_TO_12 = GRADES_KG_TO_12.slice(2);
const GRADES_KG_TO_10 = GRADES_KG_TO_12.slice(0, 12);

export const SCHOOLS: School[] = [
  {
    id: 'sabis-dhafra',
    nameEn: 'SABIS International School - Al Dhafra',
    nameAr: 'مدرسة سابيس الدولية - الظفرة',
    curriculum: 'American',
    curriculumAr: 'أمريكي',
    region: 'Al Dhafra',
    location: 'Madinat Zayed, Al Dhafra Region',
    gradesOffered: GRADES_KG_TO_12,
    capacity: generateCapacity(GRADES_KG_TO_12, 0.80),
  },
  {
    id: 'dhafra-academy',
    nameEn: 'Al Dhafra Private Academy',
    nameAr: 'أكاديمية الظفرة الخاصة',
    curriculum: 'British',
    curriculumAr: 'بريطاني',
    region: 'Al Dhafra',
    location: 'Liwa, Al Dhafra Region',
    gradesOffered: GRADES_KG_TO_12,
    capacity: generateCapacity(GRADES_KG_TO_12, 0.70),
  },
  {
    id: 'delhi-school',
    nameEn: 'Delhi Private School - Madinat Zayed',
    nameAr: 'مدرسة دلهي الخاصة - مدينة زايد',
    curriculum: 'Indian CBSE',
    curriculumAr: 'هندي CBSE',
    region: 'Al Dhafra',
    location: 'Madinat Zayed, Al Dhafra Region',
    gradesOffered: GRADES_1_TO_12,
    capacity: generateCapacity(GRADES_1_TO_12, 0.85),
  },
  {
    id: 'liwa-international',
    nameEn: 'Liwa International School',
    nameAr: 'مدرسة ليوا الدولية',
    curriculum: 'IB',
    curriculumAr: 'البكالوريا الدولية',
    region: 'Al Dhafra',
    location: 'Liwa Oasis, Al Dhafra Region',
    gradesOffered: GRADES_KG_TO_12,
    capacity: generateCapacity(GRADES_KG_TO_12, 0.60),
  },
  {
    id: 'gharbia-private',
    nameEn: 'Al Gharbia Private School',
    nameAr: 'مدرسة الغربية الخاصة',
    curriculum: 'UAE MOE',
    curriculumAr: 'وزارة التربية والتعليم',
    region: 'Al Dhafra',
    location: 'Ghayathi, Al Dhafra Region',
    gradesOffered: GRADES_KG_TO_12,
    capacity: generateCapacity(GRADES_KG_TO_12, 0.90),
  },
  {
    id: 'philippine-school',
    nameEn: 'Philippine International School - Al Dhafra',
    nameAr: 'المدرسة الفلبينية الدولية - الظفرة',
    curriculum: 'Filipino',
    curriculumAr: 'فلبيني',
    region: 'Al Dhafra',
    location: 'Madinat Zayed, Al Dhafra Region',
    gradesOffered: GRADES_KG_TO_10,
    capacity: generateCapacity(GRADES_KG_TO_10, 0.65),
  },
];

export const REGIONS = [
  { id: 'al-dhafra', nameEn: 'Al Dhafra', nameAr: 'الظفرة' },
];

export const CURRICULA = [
  { id: 'american', nameEn: 'American', nameAr: 'أمريكي' },
  { id: 'british', nameEn: 'British', nameAr: 'بريطاني' },
  { id: 'indian-cbse', nameEn: 'Indian CBSE', nameAr: 'هندي CBSE' },
  { id: 'ib', nameEn: 'IB', nameAr: 'البكالوريا الدولية' },
  { id: 'uae-moe', nameEn: 'UAE MOE', nameAr: 'وزارة التربية والتعليم' },
  { id: 'filipino', nameEn: 'Filipino', nameAr: 'فلبيني' },
];

export const ALL_GRADES = GRADES_KG_TO_12;

export function getSchoolsByRegion(region: string): School[] {
  return SCHOOLS.filter(s => s.region === region || region === 'Al Dhafra');
}

export function getSchoolById(id: string): School | undefined {
  return SCHOOLS.find(s => s.id === id);
}

export function getAvailableSeats(schoolId: string, grade: string, gender: 'male' | 'female'): number {
  const school = getSchoolById(schoolId);
  if (!school) return 0;
  const gradeData = school.capacity.find(c => c.grade === grade);
  if (!gradeData) return 0;
  const current = gender === 'male' ? gradeData.currentMale : gradeData.currentFemale;
  return Math.max(0, Math.floor(gradeData.maxCapacity / 2) - current);
}
