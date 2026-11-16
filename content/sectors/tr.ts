import type { Sector } from './types'

export const sectorsTr: Sector[] = [
  {
    key: 'dance',
    slug: 'dans-okulu-programi',
    name: 'Dans okulları',
    cardText: 'Salsa, bale, hip hop: dans türüne bağlı paketler, yoklama ve eğitmen hakedişi.',
    examples: ['Salsa', 'Bachata', 'Tango', 'Bale', 'Hip hop', 'Modern dans', 'Çocuk balesi', 'Halk dansları'],
    metaTitle: 'Dans okulu programı: yoklama, ders paketi ve eğitmen hakedişi',
    description:
      'Dans okulları ve dans stüdyoları için yönetim programı. Dans türüne bağlı ders paketleri, telefondan yoklama, otomatik kredi düşümü, eğitmen hakedişi ve kasa tek yerde.',
    keywords: ['dans okulu programı', 'dans stüdyosu programı', 'dans kursu yazılımı', 'dans okulu yönetim yazılımı'],
    heroTitle: 'Dans okulunuz için yoklama, paket ve hakediş tek yerde',
    heroLead:
      'Salsa paketi alan öğrencinin kredisi bachata dersinde düşmez, eğitmen hakedişi yoklamadan çıkar, kredisi biten öğrenci açılış ekranında görünür.',
    pains: [
      { title: 'Krediler karışıyor', text: 'Aynı öğrencinin iki farklı dansta paketi varsa, defterde hangi dersin hangi paketten düştüğü kısa sürede belirsizleşir.' },
      { title: 'Ay sonu hakediş tartışması', text: 'Eğitmenin verdiği ders sayısı, yerine giren eğitmenler ve farklı ücretler elle hesaplandığında hep bir fark çıkar.' },
      { title: 'Yenileme kaçıyor', text: 'Kredisi biten öğrenci ders geldiğinde fark edilmezse, paket yenilemesi haftalarca gecikir.' },
    ],
    fit: [
      { title: 'Dans türüne bağlı paketler', text: 'Paketler dans türüne bağlanır; yoklamada kredi doğru paketten düşer.' },
      { title: 'Telefondan yoklama', text: 'Eğitmen dersin sonunda "hepsi geldi" deyip yalnızca gelmeyenlere dokunur.' },
      { title: 'Seviyeye göre davet', text: 'Öğrencileri ve kursları "Başlangıç, Orta, İleri" diye etiketleyin; orta seviye sınıfınızda yer açılınca aynı seviyedeki öğrencileri tek tıkla davet edin.' },
      { title: 'Eğitmen hakedişi', text: 'Ücretler eğitmen, şube ve dans türüne göre tanımlanır; hakediş yoklamadan hesaplanır.' },
    ],
    setup: {
      title: 'Örnek kurulum',
      items: [
        'Ders türleri: Salsa, Bachata, Tango',
        'Paketler: 4 ders salsa (1 ay), 8 ders salsa (2 ay)',
        'Kurslar: Salsa başlangıç (Salı 19:00), Salsa orta (Perşembe 20:00)',
        'Etiketler: Başlangıç, Orta, İleri',
      ],
    },
    faq: [
      { q: 'Bir öğrencinin birden fazla dansta paketi olabilir mi?', a: 'Evet. Her paket bir dans türüne bağlıdır; öğrenci hangi derse gelirse kredi o dansın paketinden düşer.' },
      { q: 'Çift dersleri ve partner değişimi nasıl takip edilir?', a: 'Her öğrenci ayrı kaydedilir ve kendi paketinden kredi kullanır. Partner eşleştirmesi şu an programda tutulmuyor.' },
      { q: 'Gösteri ve etkinlikleri duyurabilir miyim?', a: 'Evet. Mesajlar ekranından hazır etkinlik şablonuyla öğrencilerinize WhatsApp veya SMS mesajını telefonunuzdan tek dokunuşla açabilirsiniz.' },
    ],
    blogKeys: ['software-features', 'packages', 'instructor-pay'],
  },
  {
    key: 'pilates_yoga',
    slug: 'pilates-yoga-studyosu-programi',
    name: 'Pilates ve yoga stüdyoları',
    cardText: 'Reformer, mat ve yoga dersleri için paket, yoklama ve eğitmen ücreti.',
    examples: ['Reformer pilates', 'Mat pilates', 'Hatha yoga', 'Vinyasa', 'Yin yoga', 'Hamile pilatesi', 'Özel ders'],
    metaTitle: 'Pilates ve yoga stüdyosu programı: paket, yoklama ve eğitmen ücreti',
    description:
      'Pilates ve yoga stüdyoları için yönetim programı. Reformer ve mat paketleri, haftalık grup dersleri, telefondan yoklama, kredi takibi, eğitmen ücreti ve kasa.',
    keywords: ['pilates stüdyosu programı', 'yoga stüdyosu programı', 'reformer pilates takip programı', 'pilates salonu yazılımı'],
    heroTitle: 'Pilates ve yoga stüdyonuz için paket ve yoklama takibi',
    heroLead:
      'Reformer ve mat paketlerini ayrı tutun, ders sonunda yoklamayı telefondan alın, eğitmen ücretini ders başı ya da saatlik olarak yoklamadan hesaplayın.',
    pains: [
      { title: 'Reformer ve mat ayrı paket', text: 'Reformer dersinin ücreti mattan farklıdır; tek bir "kalan ders" sayısı tutulduğunda hangi hakkın kaldığı karışır.' },
      { title: 'Süresi dolan paketler', text: 'Pilates paketleri genelde süreyle sınırlıdır. Süresi yaklaşan öğrenciye zamanında haber verilmezse dersler yanar ve öğrenci küser.' },
      { title: 'Eğitmen ücreti farklı modellerde', text: 'Bir eğitmen ders başı, diğeri saatlik ya da öğrenci başı çalışır; ay sonu hesabı elle uzun sürer.' },
    ],
    fit: [
      { title: 'Ders türüne bağlı paketler', text: 'Reformer ve mat ayrı ders türüdür; paketler türüne bağlanır, kredi doğru paketten düşer.' },
      { title: 'Süre ve kredi uyarıları', text: 'Kredisi azalan ve paketi 7 gün içinde bitecek öğrenciler listelenir; hatırlatma mesajını tek dokunuşla açarsınız.' },
      { title: 'Esnek eğitmen ücreti', text: 'Ders değerinden yüzde, ders başı, saatlik ya da öğrenci başı ücret ve asgari tutar tanımlanabilir.' },
      { title: 'Özel dersler', text: 'Tek öğrencili kurs açarak özel dersleri de aynı yerde, aynı paket mantığıyla takip edersiniz.' },
    ],
    setup: {
      title: 'Örnek kurulum',
      items: [
        'Ders türleri: Reformer pilates, Mat pilates, Yoga',
        'Paketler: 8 ders reformer (5 hafta), 12 ders mat (2 ay)',
        'Kurslar: Reformer sabah grubu (Pzt-Çar 09:00), Akşam yoga (Salı 19:30)',
        'Eğitmen ücreti: reformer için ders başı, yoga için saatlik',
      ],
    },
    faq: [
      { q: 'Öğrenciler kendi derslerini online rezerve edebiliyor mu?', a: 'Şu an hayır. StudioDesk stüdyo ekibi tarafından kullanılır; öğrenci kaydı ve yoklamayı ekip yapar.' },
      { q: 'Reformer kapasitesini sınırlayabilir miyim?', a: 'Kursa ders başına kontenjan tanımlama şu an yok. Gruplarınızı kayıtlı öğrenci sayısıyla takip edebilirsiniz; kurs sayfasında kayıtlı öğrenciler görünür.' },
      { q: 'Paket süresi dolunca kalan krediler ne olur?', a: 'Süresi geçen paket kullanılamaz ve yoklamada kredi düşmez. Süresi yaklaşan öğrencileri ana sayfada ve mesajlar ekranında görürsünüz.' },
    ],
    blogKeys: ['pilates-yoga', 'packages', 'teacher-pay'],
  },
  {
    key: 'martial_arts',
    slug: 'dovus-sanatlari-okulu-programi',
    name: 'Dövüş sanatları okulları',
    cardText: 'Karate, taekwondo, kick boks: kuşak seviyeleri, aylık paketler ve yoklama.',
    examples: ['Karate', 'Taekwondo', 'Kick boks', 'Judo', 'Boks', 'Muay thai', 'Aikido', 'Çocuk grubu'],
    metaTitle: 'Dövüş sanatları okulu programı: yoklama, aidat ve kuşak takibi',
    description:
      'Karate, taekwondo, judo ve kick boks okulları için yönetim programı. Aylık paketler, kuşak seviyesine göre gruplar, telefondan yoklama, veli iletişimi ve kasa.',
    keywords: ['karate okulu programı', 'taekwondo kulübü programı', 'dövüş sanatları okulu yazılımı', 'spor kulübü aidat takip programı'],
    heroTitle: 'Dövüş sanatları okulunuz için yoklama, aidat ve seviye takibi',
    heroLead:
      'Kuşak seviyelerini etiketle tutun, aylık paketleri ve yoklamayı tek yerde izleyin, ödemesi yaklaşan velilere hatırlatmayı telefonunuzdan gönderin.',
    pains: [
      { title: 'Aidat takibi', text: 'Aylık ödeme yapan öğrencilerin kimin ödediği, kimin geciktiği defterde ya da ayrı bir Excel dosyasında kaybolur.' },
      { title: 'Seviye grupları', text: 'Beyaz, sarı, yeşil kuşak gruplarına kimin hangi seviyede olduğu ancak hocanın hafızasında durur.' },
      { title: 'Veliyle iletişim', text: 'Öğrencilerin çoğu çocuktur; antrenman değişikliği ya da ödeme hatırlatması için velilere tek tek yazmak saatler alır.' },
    ],
    fit: [
      { title: 'Kuşak seviyesine göre etiket', text: 'Öğrencileri ve grupları "Beyaz kuşak, Sarı kuşak…" diye etiketleyin; seviyeye göre filtreleyin ve grubu eksik olan sınıfa aynı seviyedekileri davet edin.' },
      { title: 'Aylık paket', text: 'Aylık aidatı "8 ders, 1 ay geçerli" gibi bir paket olarak satın; süresi yaklaşanlar listede görünür.' },
      { title: 'Veli mesajları', text: 'Öğrenci kaydındaki telefon numarasına ödeme hatırlatması veya duyuru, hazır şablonla WhatsApp ya da SMS olarak açılır.' },
      { title: 'Sınıf değiştirme', text: 'Kuşak atlayan öğrenciyi profilinden tek adımda yeni grubuna taşırsınız; geçmiş yoklamaları korunur.' },
    ],
    setup: {
      title: 'Örnek kurulum',
      items: [
        'Ders türleri: Karate, Kick boks',
        'Paketler: Aylık karate (8 ders, 1 ay), Aylık kick boks (12 ders, 1 ay)',
        'Kurslar: Minikler (Sal-Per 17:00), Gençler (Sal-Per 18:30), Yetişkin (Pzt-Çar 20:00)',
        'Etiketler: Beyaz kuşak, Sarı kuşak, Yeşil kuşak, Siyah kuşak',
      ],
    },
    faq: [
      { q: 'Kuşak sınavlarını takip edebilir miyim?', a: 'Kuşak seviyesi etiket olarak tutulur ve değişiklik öğrencinin geçmişine düşer. Sınav takvimi ve sınav ücreti için ayrı bir modül şu an yok; ücreti kasaya gelir olarak ekleyebilirsiniz.' },
      { q: 'Aylık sabit aidatla çalışıyoruz, kredi sistemi uyar mı?', a: 'Aylık aidatı, ay boyunca katılabileceği ders sayısı kadar kredisi olan ve 1 ay geçerli bir paket olarak tanımlarsınız. Öğrenci geldikçe kredi düşer, ay bitince paket sona erer.' },
      { q: 'Veli bilgisini nereye kaydederim?', a: 'Öğrenci kaydındaki telefon alanına velinin numarasını yazabilir, notlara ek bilgileri ekleyebilirsiniz. Mesajlar bu numaraya gider.' },
    ],
    blogKeys: ['martial-arts', 'packages', 'retention'],
  },
  {
    key: 'music_art',
    slug: 'muzik-ve-sanat-kursu-programi',
    name: 'Müzik ve sanat kursları',
    cardText: 'Gitar, piyano, resim: özel ve grup dersleri, paketler ve öğretmen ücreti.',
    examples: ['Gitar', 'Piyano', 'Keman', 'Şan', 'Bateri', 'Resim', 'Seramik', 'Tiyatro'],
    metaTitle: 'Müzik ve sanat kursu programı: özel ders, paket ve öğretmen ücreti',
    description:
      'Müzik okulları, sanat atölyeleri ve tiyatro kursları için yönetim programı. Özel ve grup dersleri, ders paketleri, yoklama, öğretmen ücreti ve kasa.',
    keywords: ['müzik kursu programı', 'müzik okulu yönetim programı', 'sanat atölyesi programı', 'özel ders takip programı'],
    heroTitle: 'Müzik ve sanat kursunuz için ders, paket ve öğretmen ücreti takibi',
    heroLead:
      'Bire bir derslerle grup atölyelerini aynı takvimde yönetin. Öğrencinin kalan dersi, öğretmenin ay sonu ücreti ve kasa tek yerde.',
    pains: [
      { title: 'Çok sayıda bire bir ders', text: 'Her öğretmenin haftada onlarca özel dersi olur; hangi öğrencinin kaç dersi kaldığı ve hangi derslerin yapıldığı elle takip edilemez.' },
      { title: 'Öğretmenle hesaplaşma', text: 'Öğretmenler ders başı veya saatlik çalışır; ay sonunda iptal edilen ve telafi edilen derslerle hesap karışır.' },
      { title: 'Dönem ve atölye kayıtları', text: 'Grup atölyeleri dönemlik açılır; kayıtlar, ödemeler ve devam bilgisi farklı listelere dağılır.' },
    ],
    fit: [
      { title: 'Özel ders = tek öğrencili kurs', text: 'Her bire bir dersi tek öğrencili bir kurs olarak tanımlarsınız; yoklama, kredi ve öğretmen ücreti grup dersleriyle aynı şekilde işler.' },
      { title: 'Ders başı ya da saatlik ücret', text: 'Öğretmen ücreti ders başı, saatlik ya da ders değerinden yüzde olarak tanımlanır; ay sonu döküm yoklamadan çıkar.' },
      { title: 'Seviyeye göre gruplar', text: 'Etiketlerle başlangıç ve ileri seviye öğrencileri ayırır, yeni açılan gruba uygun öğrencileri davet edersiniz.' },
      { title: 'Konser ve sergi duyuruları', text: 'Etkinlik şablonuyla tüm öğrencilere ya da bir gruba duyuruyu telefonunuzdan tek dokunuşla açarsınız.' },
    ],
    setup: {
      title: 'Örnek kurulum',
      items: [
        'Ders türleri: Gitar, Piyano, Resim',
        'Paketler: 4 ders gitar (1 ay), 8 ders piyano (2 ay), Resim atölyesi (10 hafta)',
        'Kurslar: Ayşe – gitar özel (Pzt 17:00), Çocuk resim atölyesi (Cmt 11:00)',
        'Öğretmen ücreti: özel derslerde ders başı, atölyede saatlik',
      ],
    },
    faq: [
      { q: 'Her özel ders için ayrı kurs açmak zahmetli değil mi?', a: 'Kurs bir kez tanımlanır ve her hafta kendini tekrarlar. Öğrencinin saati değişirse sınıfını profilinden tek adımda değiştirirsiniz.' },
      { q: 'İptal edilen dersi telafi edebilir miyim?', a: 'Geçmiş bir günün yoklamasını sonradan alabilir, telafi dersini o gün işaretleyebilirsiniz. Kredi yalnızca yoklama kaydedilince düşer.' },
      { q: 'Öğretmenler kendi derslerini görebilir mi?', a: 'Evet. Öğretmen rolüyle giriş yapan kişi yoklama alabilir; hakediş ekranlarında yalnızca kendi kayıtlarını görür.' },
    ],
    blogKeys: ['music-art', 'instructor-pay', 'scheduling'],
  },
  {
    key: 'fitness',
    slug: 'fitness-grup-dersi-programi',
    name: 'Butik fitness ve grup dersleri',
    cardText: 'HIIT, spinning, fonksiyonel: paket satışı, yoklama ve eğitmen hakedişi.',
    examples: ['HIIT', 'Spinning', 'Fonksiyonel antrenman', 'Zumba', 'Crossfit', 'Body pump', 'Kangoo', 'Stretching'],
    metaTitle: 'Butik fitness ve grup dersi programı: paket, yoklama ve hakediş',
    description:
      'Butik fitness stüdyoları ve grup dersi salonları için yönetim programı. Ders paketleri, tek seferlik dersler, telefondan yoklama, eğitmen hakedişi ve kasa.',
    keywords: ['fitness stüdyosu programı', 'grup dersi takip programı', 'butik spor salonu yazılımı', 'spinning stüdyosu programı'],
    heroTitle: 'Butik fitness stüdyonuz için paket, yoklama ve hakediş',
    heroLead:
      'Haftalık grup derslerini bir kez kurun, paketleri satın, ders sonunda yoklamayı telefondan alın. Eğitmen hakedişi ve kasa ay sonunda hazır.',
    pains: [
      { title: 'Çok ders, çok eğitmen', text: 'Haftada onlarca grup dersi ve dönüşümlü eğitmenler olduğunda kimin hangi dersi verdiği ve kaç kişinin geldiği kaybolur.' },
      { title: 'Tek seferlik katılım', text: 'Paket almadan tek derse gelen üyeler ödemeyi ve yoklamayı ayrı yerlere dağıtır.' },
      { title: 'Doluluk görülmüyor', text: 'Hangi saatin dolu, hangisinin boş geçtiği ancak ay sonunda fark edilir; düşük katılımlı dersler maliyet yaratır.' },
    ],
    fit: [
      { title: 'Paket ve tek ders', text: 'Tek seferlik katılımı 1 derslik paket olarak satın; kredi takibi diğer paketlerle aynı yerde.' },
      { title: 'Yerine giren eğitmen', text: 'Yoklamada dersi veren eğitmeni seçersiniz; hakediş dersi gerçekten verene yazılır.' },
      { title: 'Grup kârlılığı', text: 'Her grubun ders sayısı, ortalama katılımı, geliri ve eğitmen maliyeti raporda yan yana görünür.' },
      { title: 'Kredisi biten üyeler', text: 'Açılış ekranında kredisi bitmek üzere olan üyeler listelenir; hatırlatmayı tek dokunuşla gönderirsiniz.' },
    ],
    setup: {
      title: 'Örnek kurulum',
      items: [
        'Ders türleri: HIIT, Spinning, Fonksiyonel',
        'Paketler: Tek ders, 10 ders (6 hafta), 20 ders (3 ay)',
        'Kurslar: Sabah HIIT (Pzt-Çar-Cum 07:30), Akşam spinning (Sal-Per 19:00)',
        'Eğitmen ücreti: ders başı sabit, katılım düşükse asgari tutar',
      ],
    },
    faq: [
      { q: 'Üyelerin kendi derslerine kaydolması mümkün mü?', a: 'Şu an değil. Kayıt ve yoklamayı stüdyo ekibi yapar; üyeler programı kullanmaz.' },
      { q: 'Sınırsız aylık üyelik tanımlayabilir miyim?', a: 'Ay içinde katılabileceği ders sayısından fazla kredili, 1 ay geçerli bir paket tanımlayarak pratikte sınırsız üyelik oluşturabilirsiniz.' },
      { q: 'Birden fazla şubemiz var, raporlar ayrı mı?', a: 'Evet. Programlar, salonlar ve kasa şubeye göre ayrılır; tüm şubeleri tek hesaptan yönetirsiniz.' },
    ],
    blogKeys: ['fitness', 'underfilled', 'cash'],
  },
]
