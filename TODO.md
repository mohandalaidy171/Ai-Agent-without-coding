# TODO - Variable Management + Picker

## Plan
- [ ] 1) تحديث بنية `systemVariables` لتخزين `{ type, value }` بدلاً من قيمة فقط (مع دعم البيانات القديمة).
- [ ] 2) إضافة UI: زر **حفظ/تحديث** لتعديل المتغير بعد إنشائه.
- [ ] 3) إضافة UI داخل Step Builder: زر لفتح **Variable Picker**.
- [ ] 4) Variable Picker يعرض:
  - {VAR_NAME}
  - نوع المتغير (type)
  - نوع التحقق (assertionType) المتوافق مع سياق الحقل (خصوصاً text_match).
- [ ] 5) اختيار متغير من الـ picker يدرج `{VAR_NAME}` في حقل القيمة المناسب.
- [ ] 6) تحديث الاستيراد/التصدير والحفظ المحلي (localStorage) للتوافق.
- [ ] 7) تحديث `resolveSystemVariables` ليستخدم `value` من البنية الجديدة.

## Done
- [x] TODO plan created


