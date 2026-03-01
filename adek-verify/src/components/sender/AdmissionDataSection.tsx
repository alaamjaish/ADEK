'use client';

import { useLang } from '@/app/layout';
import Select from '@/components/ui/Select';
import { AdmissionData } from '@/lib/data/types';
import { REGIONS, SCHOOLS, ALL_GRADES } from '@/lib/data/schools';

interface Props {
  data: AdmissionData;
  onChange: (data: AdmissionData) => void;
}

export default function AdmissionDataSection({ data, onChange }: Props) {
  const { lang, t } = useLang();

  const update = (field: keyof AdmissionData, value: string) => {
    const newData = { ...data, [field]: value };
    // Reset dependent fields when parent changes
    if (field === 'targetRegion') {
      newData.targetSchool = '';
      newData.targetCurriculum = '';
      newData.targetGrade = '';
    } else if (field === 'targetSchool') {
      const school = SCHOOLS.find(s => s.id === value);
      newData.targetCurriculum = school?.curriculum || '';
      newData.targetGrade = '';
    }
    onChange(newData);
  };

  const filteredSchools = SCHOOLS.filter(
    s => !data.targetRegion || s.region === 'Al Dhafra'
  );

  const selectedSchool = SCHOOLS.find(s => s.id === data.targetSchool);
  const availableGrades = selectedSchool?.gradesOffered || ALL_GRADES;

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-adek-navy border-b border-adek-border pb-2">
        {t('بيانات القبول', 'Admission Data')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Target Region"
          labelAr="المنطقة المرغوبة"
          lang={lang}
          value={data.targetRegion}
          onChange={(e) => update('targetRegion', e.target.value)}
          required
          placeholder={t('-- اختر المنطقة --', '-- Select Region --')}
          options={REGIONS.map(r => ({
            value: r.nameEn,
            label: r.nameEn,
            labelAr: r.nameAr,
          }))}
        />
        <Select
          label="Target School"
          labelAr="المدرسة المرغوبة"
          lang={lang}
          value={data.targetSchool}
          onChange={(e) => update('targetSchool', e.target.value)}
          required
          placeholder={t('-- اختر المدرسة --', '-- Select School --')}
          options={filteredSchools.map(s => ({
            value: s.id,
            label: s.nameEn,
            labelAr: s.nameAr,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Target Curriculum"
          labelAr="المنهج المرغوب"
          lang={lang}
          value={data.targetCurriculum}
          onChange={(e) => update('targetCurriculum', e.target.value)}
          required
          placeholder={t('-- يتحدد بالمدرسة --', '-- Set by school --')}
          options={selectedSchool ? [{
            value: selectedSchool.curriculum,
            label: selectedSchool.curriculum,
            labelAr: selectedSchool.curriculumAr,
          }] : []}
        />
        <Select
          label="Target Grade"
          labelAr="الصف المرغوب"
          lang={lang}
          value={data.targetGrade}
          onChange={(e) => update('targetGrade', e.target.value)}
          required
          placeholder={t('-- اختر الصف --', '-- Select Grade --')}
          options={availableGrades.map(g => ({
            value: g,
            label: g,
            labelAr: g,
          }))}
        />
      </div>

      {/* School info badge */}
      {selectedSchool && (
        <div className="p-3 rounded-lg bg-adek-navy/5 border border-adek-navy/10 text-sm animate-fade-in">
          <p className="font-medium text-adek-navy">
            {lang === 'ar' ? selectedSchool.nameAr : selectedSchool.nameEn}
          </p>
          <p className="text-adek-text-secondary text-xs mt-1">
            {t('المنهج:', 'Curriculum:')} {lang === 'ar' ? selectedSchool.curriculumAr : selectedSchool.curriculum}
            {' | '}
            {t('الموقع:', 'Location:')} {selectedSchool.location}
          </p>
        </div>
      )}
    </div>
  );
}
