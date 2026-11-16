# Dans dışı stüdyolara açılma: etki analizi

_Tarih: 2026-11-15 · Durum: A + B uygulandı (2026-11-16)_

## Neden
StudioDesk şu an yalnızca dans okullarına yönelik (README, veri modeli, çeviriler, site, blog). Ama çekirdek kurgu
(tekrarlanan grup dersleri, paket/kredi, yoklamadan hakediş, şube/salon, kasa) şu işletmelere de uyar:
- Pilates / yoga stüdyoları, butik fitness ve grup dersi salonları
- Dövüş sanatları okulları (karate, taekwondo, boks)
- Müzik, resim, tiyatro kursları; çocuk atölyeleri
- Jimnastik, yüzme okulları

Önündeki engel çoğunlukla isimlendirme: "dans türü" kavramı DB'de, kodda, çevirilerde ve sitede sabit.

## Etki alanı (70 dosya)

### 1. Veritabanı (en riskli)
- `dance_types` tablosu; FK kolonları `courses.dance_type_id`, `packages.dance_type_id`, `instructor_rates.dance_type_id`
  (`UNIQUE (instructor_id, branch_id, dance_type_id)`).
- İndeksler, RLS politikaları (`"dance_types: members read/insert/update"`), updated_at trigger listesi.
- `history_logs.entity` içinde **veri olarak** `'dance_type'` saklanıyor → tablo adı değişirse data migration gerekir.
- Canlı kayıt sayıları henüz kontrol edilmedi (Supabase MCP zaman aşımı).

### 2. Uygulama kodu
- Server action'lar (~220 satır): `dance-types.actions.ts` tamamen; ayrıca `students`, `courses`, `instructor-rates`,
  `instructors`, `packages`, `course-students`, `schedule`, `history` action'ları.
- Hakediş: `lib/earnings/sessionEarnings.ts` ücret oranını `dance_type_id` ile buluyor (mantık aynı, isim değişir).
- Rota: `/dashboard/dance-types` (liste, detay, new, edit), `ROUTES.DANCE_TYPES`, Sidebar menü öğesi.
- ~25 bileşen: `DanceTypeForm`, `CourseForm`, `PackageForm`, `InstructorRateForm`, öğrenci/eğitmen tabloları, yoklama.
- `lib/types/database.types.ts`, `lib/utils/history.ts` (`"dance_type"` entity), `HistoryComponent` ikon eşlemesi.

### 3. Çeviriler
- `messages/tr.json` ve `en.json`: ~135'er metin. Yoğun: `danceTypes`/`danceTypeForm`, `courses`, `attendance`,
  `serverErrors` (16), `site` (12).

### 4. Marka, site, içerik
- Logo dansçı "S" (`components/brand/Logo.tsx`); boş durum animasyonu dansçı (`empty-dancer.json`, `DancerAnimation`).
- Ana sayfa dans stilleri `Marquee`'si; `app/layout.tsx` meta başlık/açıklama/anahtar kelimeler.
- Blog (TR+EN ~140 satır) tamamen dans okulu odaklı.
- Hukuki: mesafeli satış metni hizmeti "esas olarak dans stüdyolarına" sunulmuş olarak tanımlıyor.

## Seçenekler

| | Ne değişir | Efor | Risk |
|---|---|---|---|
| **A. Sadece metin** | Çevirilerde "Dans türü" → "Branş"/"Ders türü"; DB ve kod adları aynı | ~1 gün | Çok düşük |
| **B. İşletmeye göre terim** | `organizations.business_type` (dans, pilates, dövüş sanatları…); ICU `select` ile metinler değişir; boş durum animasyonu genelleşir | 3–5 gün | Düşük |
| **C. Tam yeniden adlandırma** | `dance_types` → örn. `disciplines`: tablo, kolonlar, RLS, history verisi, rota, dosya/fonksiyon adları; yeni migration + tip üretimi + advisor kontrolü | 1–2 hafta | Orta (canlı veri migration'ı) |

**Öneri:** önce A + B (kullanıcının gördüğü her şey genelleşir, DB'ye dokunulmaz). C yalnızca ürün kalıcı olarak
çok sektörlü olursa.

## Açık kararlar
- Marka dans kimliğiyle mi kalacak, yoksa logo/site genelleşecek mi?
- Sektör başına ayrı açılış sayfası (`/pilates`, `/dovus-sanatlari`) yapılacak mı?
- Hangi sektörler ilk hedef?
- Canlıdaki `dance_types` / `history_logs` kayıt sayılarını kontrol et (C seçilirse).

## Uygulandı (16 Kasım 2026): A + B
- **Dil:** Uygulamada "Dans türü" → "Ders türü" (EN "Class type"); meta, boş durumlar ve doğum günü şablonu genel. DB/kod adları (`dance_types`, `/dashboard/dance-types`) bilerek aynı kaldı.
- **İşletme türü:** `organizations.business_type` (dance, pilates_yoga, martial_arts, music_art, fitness, other). Ayarlar > Genel ve backoffice'te yeni stüdyo formunda seçiliyor; ders türü örnekleri buna göre geliyor.
- **Site:** Ana sayfa metinleri genel, "Kimler için" bölümü, `/for/[slug]` sektör sayfaları (5 sektör, TR+EN, FAQ JSON-LD, sitemap), footer'da sektör linkleri.
- **Blog:** Pilates/yoga, dövüş sanatları, müzik/sanat, butik fitness için TR+EN birer yazı (`content/blog/sectors.*.ts`).
- **Yasal:** Mesafeli satış metninde hedef kitle cümlesi genelleştirildi.
- **Açık:** Online rezervasyon ve ders kontenjanı yok (sektör SSS'lerinde açıkça yazıldı). Eğitmen rolü kasa ekranını görebiliyor; ayrıca bakılmalı.
