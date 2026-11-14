# Rakip blog analizi ve özellik fikirleri

Kasım 2026'da taranan bloglar: Dance Studio Manager, DanceStudio-Pro (gostudiopro), Reservio, Dance Studio Owner, Jackrabbit Dance.

## Blog'a uyarlanan konular

| Rakip konusu | Kaynak | StudioDesk yazısı (TR / EN) |
|---|---|---|
| Top 10 dance studio software features / What dance studios need | DanceStudio-Pro, DSM | `dans-okulu-programi-secimi` / `dance-studio-software-features` |
| Dance studio management guide / Studio automation | DanceStudio-Pro | `studyo-programi-nedir` / `what-is-studio-management-software` |
| Registration forms / Parent frustrations | DanceStudio-Pro, DSM | `ogrenci-kayit-takip-programi` / `student-registration-tracking` |
| Signs your studio has outgrown spreadsheets / needs better software | DSM | `excel-ile-studyo-yonetimi` / `outgrown-spreadsheets` |
| Free vs paid dance studio software | DSM | `ucretsiz-dans-studyosu-programi` / `free-vs-paid-dance-studio-software` |
| Scheduling mistakes / Recurring classes without clashes | DSM, Reservio | `ders-programi-hatalari` / `class-scheduling-mistakes` |
| Why parents leave / Engaging and retaining students | DSM, Jackrabbit | `ogrenci-birakma-nedenleri` / `student-retention` |
| How to switch software without losing data | DSM | `studyo-programina-gecis` / `switch-studio-software` |
| Dance teacher pay rates / teacher contracts | DSM, DanceStudio-Pro | `dans-egitmeni-ucreti` / `dance-teacher-pay` |
| Underfilled classes | DanceStudio-Pro | `az-dolu-gruplar` / `underfilled-classes` |
| Tuition management | Jackrabbit | `dans-studyosu-gelir-gider-takibi` / `dance-studio-income-expense-tracking` |
| How to start a dance studio / business plan | DanceStudio-Pro | `dans-studyosu-nasil-acilir` / `how-to-start-a-dance-studio` |
| (yerel ihtiyaç) çok şubeli yönetim | — | `cok-subeli-dans-okulu-yonetimi` / `multi-location-studio-management` |

Mevcut üç yazı (yoklama, paket/kredi, eğitmen hakedişi) korundu; EN sürümlere İngilizce slug verildi, hakediş yazısı gerçek hesaplama modeline (paket fiyatının yüzdesi) göre düzeltildi.

## Uymayan konular: özellik fikirleri

Rakiplerin yazdığı ama StudioDesk'te karşılığı olmayan konular. Yazı yazmadık; ürün yol haritası için not.

### Ödeme ve tahsilat
- **Online ödeme / kartla tahsilat** (DSM: CardConnect, Bacs, BECS; Jackrabbit: tuition automation). Türkiye için iyzico veya PayTR ile paket satışında link ile ödeme.
- **Otomatik yenileme / abonelik**: kredisi biten öğrenciye kayıtlı kartla paket yenileme.
- **Hediye kartı / ders hediyesi** (Reservio: gift vouchers).

### Öğrenci ve veli tarafı
- **Öğrenci / veli portalı**: kalan kredi, ders programı, geçmiş katılım (DSM: parent experience). Yazılarda "öğrenci sormadan bilsin" diyoruz; şu an bunu sağlayan bir ekran yok.
- **Online kayıt formu ve deneme dersi talebi** (DanceStudio-Pro: registration form templates). Landing'deki demo formuna benzer, stüdyonun kendi sitesine gömülebilir form.
- **Dijital onay / e-imza** (sağlık beyanı, KVKK onayı, kurallar).
- **Bekleme listesi**: dolu gruba kayıt isteyenler.

### Hatırlatma ve iletişim
- **Otomatik hatırlatma (SMS / WhatsApp / e-posta)**: kredisi bitti, paket süresi doluyor, iki haftadır gelmedi (Reservio: SMS compliance; DSM: parent communication). İYS ve KVKK uyumu gerekir.
- **Toplu duyuru / bülten** (DanceStudio-Pro: newsletter, event email copy).
- **Arkadaşını getir / referans takibi** (Reservio: referral program).

### Etkinlik ve gösteri
- **Gösteri / recital bilet satışı, numaralı oturma** (Jackrabbit, DanceStudio-Pro, Dance Studio Owner). Yıl sonu gösterileri olan çocuk ve bale okulları için önemli.
- **Gösteri sıralama aracı** (Jackrabbit: recital order generator; aynı öğrencinin art arda iki dansta olmasını engelleme).
- **Kostüm ve ürün satışı / stok** (Dance Studio Owner: dancewear, merch).
- **Yaz kampı / atölye gibi tarih aralıklı programlar** (Jackrabbit: camps). Şu an kurslar haftalık tekrarlı; tek seferlik atölye ya da 2 haftalık kamp modeli yok.

### Raporlama
- **Öğrenci bağlılığı raporu**: aktif öğrenci, yenileme oranı, 30 gündür gelmeyenler (blog'da önerdiğimiz üç sayı).
- **Grup kârlılığı raporu**: grup geliri ile eğitmen hakedişini yan yana (az dolu gruplar yazısı).
- **Salon çakışma uyarısı**: aynı salona aynı saatte iki kurs tanımlanınca uyarı (ders programı yazısı).
- **Kayıt kaynağı ("bizi nereden duydunuz")** alanı ve raporu.

### Geçiş
- **CSV / Excel'den öğrenci ve kalan kredi içe aktarma** (DSM: switching software). Geçiş yazısında kurulumu birlikte yaptığımızı söylüyoruz; self-servis içe aktarma satış sürtünmesini azaltır.

## Not: hakediş hesaplaması değişti (15 Kasım 2026)

Eski yöntem: oran × dans türünün (tek) paket liste fiyatı, ders başına sabit. Dans türünde birden fazla paket olunca `.single()` hata verip hakedişi 0 yazıyordu.

Yeni yöntem (`lib/earnings/sessionEarnings.ts`): kredisi düşülen her yoklama için ders değeri = öğrencinin paket için ödediği tutar (kasadaki gelir kaydı, yoksa liste fiyatı) ÷ paketteki ders sayısı. Eğitmen hakedişi = oran × bu değerlerin toplamı. Kredisi düşülmeyen yoklama sayılmaz. Yoklama kaydedilince ve tek bir kayıt silinince yeniden hesaplanır.
