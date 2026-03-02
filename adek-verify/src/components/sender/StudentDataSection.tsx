'use client';

import { useLang } from '@/app/layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { StudentData } from '@/lib/data/types';
import { calculateAge } from '@/lib/utils';

interface Props {
  data: StudentData;
  onChange: (data: StudentData) => void;
}

export default function StudentDataSection({ data, onChange }: Props) {
  const { lang, t } = useLang();

  const update = (field: keyof StudentData, value: string) => {
    const newData = { ...data, [field]: value };
    if (field === 'dateOfBirth') {
      newData.age = calculateAge(value);
    }
    onChange(newData);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-adek-navy border-b border-adek-border pb-2">
        {t('بيانات الطالب', 'Student Data')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="eSIS Number"
          labelAr="رقم الطالب"
          lang={lang}
          value={data.esisNumber}
          readOnly
          className="bg-gray-50"
        />
        <Input
          label="Application Number"
          labelAr="رقم الاستمارة"
          lang={lang}
          value={data.applicationNumber}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Student Name (Arabic)"
          labelAr="اسم الطالب بالعربي"
          lang={lang}
          value={data.studentNameArabic}
          onChange={(e) => update('studentNameArabic', e.target.value)}
          required
          dir="rtl"
          placeholder={t('الاسم الكامل بالعربي', 'Full name in Arabic')}
        />
        <Input
          label="Student Name (English)"
          labelAr="اسم الطالب بالإنجليزي"
          lang={lang}
          value={data.studentNameEnglish}
          onChange={(e) => update('studentNameEnglish', e.target.value)}
          required
          dir="ltr"
          placeholder="Full name in English"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Gender"
          labelAr="الجنس"
          lang={lang}
          value={data.gender}
          onChange={(e) => update('gender', e.target.value)}
          required
          placeholder={t('-- اختر --', '-- Select --')}
          options={[
            { value: 'male', label: 'Male', labelAr: 'ذكر' },
            { value: 'female', label: 'Female', labelAr: 'أنثى' },
          ]}
        />
        <Input
          label="Date of Birth"
          labelAr="تاريخ الميلاد"
          lang={lang}
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => update('dateOfBirth', e.target.value)}
          required
        />
        <Input
          label="Age"
          labelAr="العمر"
          lang={lang}
          value={data.age !== null ? String(data.age) : ''}
          readOnly
          className="bg-gray-50"
          placeholder={t('يُحسب تلقائياً', 'Auto-calculated')}
        />
      </div>

      <Input
        label="Nationality"
        labelAr="الجنسية"
        lang={lang}
        value={data.nationality}
        onChange={(e) => update('nationality', e.target.value)}
        required
        placeholder={t('مثال: إماراتي، مصري، هندي', 'e.g. Emirati, Egyptian, Indian')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Religion"
          labelAr="الديانة"
          lang={lang}
          value={data.religion}
          onChange={(e) => update('religion', e.target.value)}
          required
          placeholder={t('-- اختر --', '-- Select --')}
          options={[
            { value: 'muslim', label: 'Muslim', labelAr: 'مسلم' },
            { value: 'non-muslim', label: 'Non-Muslim', labelAr: 'غير مسلم' },
          ]}
        />
        <Input
          label="Registration Date"
          labelAr="تاريخ التسجيل"
          lang={lang}
          type="date"
          value={data.registrationDate}
          readOnly
          className="bg-gray-50"
        />
      </div>
    </div>
  );
}
