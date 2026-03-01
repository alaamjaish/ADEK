'use client';

import { useLang } from '@/app/layout';
import Input from '@/components/ui/Input';
import { GuardianData } from '@/lib/data/types';

interface Props {
  data: GuardianData;
  onChange: (data: GuardianData) => void;
}

export default function GuardianDataSection({ data, onChange }: Props) {
  const { lang, t } = useLang();

  const update = (field: keyof GuardianData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-adek-navy border-b border-adek-border pb-2">
        {t('معلومات ولي الأمر', 'Guardian Information')}
      </h3>

      <Input
        label="Guardian Name"
        labelAr="اسم ولي الأمر"
        lang={lang}
        value={data.guardianName}
        onChange={(e) => update('guardianName', e.target.value)}
        required
        placeholder={t('الاسم الكامل لولي الأمر', 'Full name of guardian')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Emirates ID Number"
          labelAr="رقم الهوية الإماراتية"
          lang={lang}
          value={data.emiratesIdNumber}
          onChange={(e) => update('emiratesIdNumber', e.target.value)}
          required
          placeholder="784-XXXX-XXXXXXX-X"
          dir="ltr"
        />
        <Input
          label="ID Expiry Date"
          labelAr="تاريخ انتهاء الهوية"
          lang={lang}
          type="date"
          value={data.idExpiryDate}
          onChange={(e) => update('idExpiryDate', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Phone Number"
          labelAr="رقم الهاتف"
          lang={lang}
          type="tel"
          value={data.phoneNumber}
          onChange={(e) => update('phoneNumber', e.target.value)}
          required
          placeholder="+971 XX XXX XXXX"
          dir="ltr"
        />
        <Input
          label="Email"
          labelAr="البريد الإلكتروني"
          lang={lang}
          type="email"
          value={data.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="example@email.com"
          dir="ltr"
        />
      </div>

      <Input
        label="Address"
        labelAr="العنوان"
        lang={lang}
        value={data.address}
        onChange={(e) => update('address', e.target.value)}
        placeholder={t('العنوان الكامل', 'Full address')}
      />
    </div>
  );
}
