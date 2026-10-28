# Raqamjon 🦉

6–8 yoshli bolalar uchun matematika o‘yini: sanash, qo‘shish, ayirish, taqqoslash va mental arifmetika (abakus) kursi. Telefon, planshet va kompyuterda brauzer orqali ishlaydi, telefonga ilova sifatida o‘rnatiladi va internetsiz ham ochiladi.

## Nimalar bor

- **15 ta o‘yin**, har birida 5 ta daraja (5 gacha → 20 gacha, o‘nlikdan o‘tib): mevalarni sanash, uch qadam, uchib ketdi (ayirish), qurtcha, sirli katak, ochko‘z timsoh (>, <, =), amallar bog‘i, asalari uyasi (piramida), sehrli g‘ildirak, sonlar poyezdi, pufaklar, tarozi, do‘kon, juftini top, kunlik sarguzasht.
- **Moslashuvchan qiyinlik:** 5 ta ketma-ket to‘g‘ri javob — qiyinlashadi, 2 ta xato — osonlashadi va rasmli yordam chiqadi. Bola ko‘p xato qilgan misollar ko‘proq beriladi.
- **Mental arifmetika:** ekrandagi abakus (soroban), 8 modul, 32 dars: kichik va katta do‘stlar, xayoliy abakus, flesh-anzan. “O‘zim o‘rganaman” va “Ota-ona bilan” rejimlari.
- **Rag‘batlantirish:** yulduzlar, tangalar, 40 ta stiker, Bilimdon boyo‘g‘li uchun kiyimlar, ketma-ket kunlar, medallar, chop etiladigan diplom.
- **Ota-ona paneli** (ko‘paytirish misoli bilan himoyalangan): statistika, qiyin misollar, sozlamalar, kunlik vaqt chegarasi, ish varag‘ini chop etish, zaxira nusxa.
- **O‘zbekcha ovoz:** barcha ko‘rsatmalar va sonlar ovoz bilan o‘qiladi.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # misollar generatori testlari
npm run build    # dist/ papkasi
```

## Ovoz fayllari

Matnlar `src/audio/clips.json` faylida. Unga yangi ibora qo‘shilsa yoki o‘zgartirilsa, GitHub Actions (`.github/workflows/voice.yml`) Microsoft Edge’ning o‘zbekcha neyron ovozi (`uz-UZ-MadinaNeural`) bilan MP3 fayllarni avtomatik yaratib, `public/audio/` ga yuklaydi. Qo‘lda: `pip install edge-tts && python scripts/gen_voice.py`. Erkak ovozi uchun: `VOICE=uz-UZ-SardorNeural`.

## Vercel

Repozitoriyni Vercel’ga ulang: Framework — **Vite**, qolgan sozlamalar avtomatik. Har bir `main` ga yuklangan o‘zgarish saytga avtomatik chiqadi.

## Texnologiyalar

React 19, TypeScript, Vite, Tailwind CSS, Zustand (ma’lumotlar brauzerda saqlanadi), vite-plugin-pwa, canvas-confetti, Vitest.
