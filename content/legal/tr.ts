import { COMPANY, dash } from '../company'
import type { LegalDoc } from './types'

type Slug = 'kvkk' | 'privacy' | 'terms' | 'cookies' | 'distance-sales'

const UPDATED = '2026-11-14'

const controllerTable = {
  type: 'table' as const,
  head: ['Bilgi', 'Değer'],
  rows: [
    ['Unvan', COMPANY.name],
    ['Adres', dash(COMPANY.address)],
    ['E-posta', dash(COMPANY.email)],
    ['KEP adresi', dash(COMPANY.kep)],
    ['MERSİS no', dash(COMPANY.mersis)],
  ],
}

export const legalTr: Record<Slug, LegalDoc> = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    description: 'StudioDesk kapsamında işlenen kişisel veriler, işleme amaçları ve haklarınız.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Veri sorumlusu',
        blocks: [
          {
            type: 'p',
            text: `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca hazırlanmıştır. ${COMPANY.product} hizmetini ${COMPANY.name} işletir.`,
          },
          controllerTable,
          {
            type: 'p',
            text: `Hesap sahipleri, demo talebinde bulunanlar ve web sitesi ziyaretçileri bakımından veri sorumlusu ${COMPANY.name}'dır. Stüdyoların ${COMPANY.product}'a kaydettiği öğrenci ve eğitmen verileri bakımından veri sorumlusu ilgili stüdyodur; ${COMPANY.name} bu verileri stüdyo adına ve onun talimatıyla işleyen veri işleyendir. Öğrenciler ve eğitmenler haklarını öncelikle kayıtlı oldukları stüdyoya iletebilir.`,
          },
        ],
      },
      {
        heading: 'İşlenen veriler, amaçlar ve hukuki sebepler',
        blocks: [
          {
            type: 'table',
            head: ['Kim', 'Hangi veriler', 'Amaç', 'Hukuki sebep (KVKK m.5)'],
            rows: [
              [
                'Hesap sahipleri (stüdyo sahibi, yönetici, personel)',
                'Ad soyad, e-posta, şifre özeti, rol, organizasyon üyeliği, işlem kayıtları',
                'Hesabı açmak ve yönetmek, girişi doğrulamak, yetkileri uygulamak, destek vermek',
                'Sözleşmenin kurulması ve ifası; meşru menfaat (güvenlik ve kötüye kullanımın önlenmesi)',
              ],
              [
                'Stüdyo öğrencileri (stüdyo adına)',
                'Ad soyad, e-posta, telefon, notlar, kurs kayıtları, paket ve kredi bilgileri, yoklama kayıtları',
                'Stüdyonun ders, paket ve yoklama süreçlerini yürütmesi',
                'Stüdyo ile öğrenci arasındaki sözleşmenin ifası (stüdyonun belirlediği sebep)',
              ],
              [
                'Eğitmenler (stüdyo adına)',
                'Ad soyad, e-posta, telefon, verdiği dersler, ücret oranları ve hakedişler',
                'Ders atama, hakediş ve ödeme hesaplaması',
                'Stüdyo ile eğitmen arasındaki sözleşmenin ifası (stüdyonun belirlediği sebep)',
              ],
              [
                'Demo talebinde bulunanlar',
                'Ad soyad, stüdyo adı, telefon, e-posta, şehir, öğrenci sayısı aralığı, mesaj',
                'Talebe dönüş yapmak, ürünü tanıtmak ve kurulum planlamak',
                'Bir sözleşmenin kurulmasıyla doğrudan ilgili olması; meşru menfaat',
              ],
              [
                'Web sitesi ziyaretçileri',
                'IP adresi, tarayıcı ve cihaz bilgisi, sunucu kayıtları; izin verilirse anonim ziyaret istatistikleri',
                'Hizmetin güvenliği ve çalışması; izin verilirse sitenin nasıl kullanıldığını ölçmek',
                'Meşru menfaat; analitik için açık rıza',
              ],
            ],
          },
          {
            type: 'p',
            text: 'Özel nitelikli kişisel veri (sağlık, biyometrik vb.) toplamayız. Stüdyoların not alanlarına bu tür veriler girmemesini öneririz. Şu an pazarlama amaçlı ileti göndermiyoruz; ileride gönderirsek ayrıca onayınızı alırız.',
          },
        ],
      },
      {
        heading: 'Verilerin aktarılması',
        blocks: [
          { type: 'p', text: 'Kişisel verileri satmayız ve reklam amacıyla paylaşmayız. Veriler yalnızca aşağıdaki alıcılara, hizmetin gerektirdiği ölçüde aktarılır:' },
          {
            type: 'ul',
            items: [
              'Altyapı hizmet sağlayıcıları: veritabanı ve kimlik doğrulama için Supabase (sunucular Avrupa Birliği, Frankfurt), barındırma ve analitik için Vercel.',
              'Stüdyonun kendi yetkili kullanıcıları (rolüne göre).',
              'Kanunen yetkili kamu kurum ve kuruluşları, talep halinde ve yalnızca kanunun gerektirdiği ölçüde.',
            ],
          },
          {
            type: 'p',
            text: 'Altyapı sağlayıcılarının sunucuları yurt dışında bulunduğundan veriler KVKK m.9 kapsamında yurt dışına aktarılır. Bu aktarım, Kurul tarafından ilan edilen standart sözleşmeler veya Kanun\'da öngörülen diğer güvencelere dayanılarak yapılır.',
          },
        ],
      },
      {
        heading: 'Toplama yöntemi',
        blocks: [
          {
            type: 'p',
            text: 'Veriler elektronik ortamda; kayıt ve demo formları, stüdyo kullanıcılarının panele girdiği bilgiler, yoklama ve satış işlemleri ile sistemin otomatik tuttuğu işlem ve sunucu kayıtları aracılığıyla toplanır.',
          },
        ],
      },
      {
        heading: 'Saklama süresi',
        blocks: [
          {
            type: 'ul',
            items: [
              'Hesap verileri: hesap açık olduğu sürece; hesabın kapatılmasından sonra yasal yükümlülükler için gereken süre kadar.',
              'Stüdyo verileri (öğrenci, eğitmen, yoklama, kasa): stüdyo silene ya da sözleşme sona erene kadar; ardından makul bir yedek süresi sonunda silinir.',
              'Demo talepleri: talep sonuçlandıktan sonra en fazla 1 yıl.',
              'Fatura ve muhasebe kayıtları: ilgili mevzuatta öngörülen süre boyunca.',
            ],
          },
        ],
      },
      {
        heading: 'Haklarınız',
        blocks: [
          {
            type: 'p',
            text: 'KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini veya yok edilmesini isteme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.',
          },
          {
            type: 'p',
            text: 'Başvurularınızı yazılı olarak, KEP adresimize, güvenli elektronik imza veya mobil imza ile ya da sistemimizde kayıtlı e-posta adresinizden yukarıdaki iletişim bilgilerine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi halinde Kurul\'un belirlediği tarife uygulanabilir. Başvurunuzun reddedilmesi veya cevabı yetersiz bulmanız halinde Kişisel Verileri Koruma Kurulu\'na şikâyette bulunabilirsiniz.',
          },
        ],
      },
    ],
  },

  privacy: {
    title: 'Gizlilik Politikası',
    description: 'StudioDesk verileri nasıl korur ve kullanır.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Kısaca',
        blocks: [
          {
            type: 'ul',
            items: [
              'Verilerinizi satmayız, reklam için kullanmayız.',
              'Stüdyonuzun verileri yalnızca stüdyonuzun yetkili kullanıcılarına görünür.',
              'Analitik yalnızca tanıtım sayfalarında ve izin verirseniz çalışır; panelin içinde çalışmaz.',
              'Ayrıntılar ve haklarınız için KVKK Aydınlatma Metni\'ne bakın.',
            ],
          },
        ],
      },
      {
        heading: 'Hangi verileri işliyoruz',
        blocks: [
          {
            type: 'p',
            text: `${COMPANY.product}, stüdyoların öğrenci, eğitmen, ders, paket, yoklama ve kasa bilgilerini yönetmesi için bir araçtır. Bu bilgileri stüdyo girer ve stüdyo adına saklarız. Hesap açarken ad, e-posta ve rol bilgileriniz; demo talebinde ise formda paylaştığınız bilgiler işlenir.`,
          },
        ],
      },
      {
        heading: 'Stüdyolar arası ayrım',
        blocks: [
          {
            type: 'p',
            text: 'Her stüdyonun verisi ayrı tutulur. Veritabanı düzeyinde satır bazlı erişim kuralları ve sunucu tarafında organizasyon kontrolleri, bir stüdyonun kullanıcısının başka bir stüdyonun verisini görmesini engeller. Kullanıcılar yalnızca rollerinin izin verdiği işlemleri yapabilir.',
          },
        ],
      },
      {
        heading: 'Güvenlik',
        blocks: [
          {
            type: 'ul',
            items: [
              'Tüm bağlantılar HTTPS ile şifrelenir.',
              'Şifreler açık metin olarak saklanmaz; kimlik doğrulama Supabase Auth ile yapılır.',
              'Yönetici tarafından açılan hesaplarda ilk girişte şifre değişikliği zorunludur.',
              'Kritik işlemler (satış, yoklama, silme) işlem geçmişine kaydedilir.',
            ],
          },
        ],
      },
      {
        heading: 'Hizmet sağlayıcılar',
        blocks: [
          {
            type: 'table',
            head: ['Sağlayıcı', 'Ne için', 'Konum'],
            rows: [
              ['Supabase', 'Veritabanı, kimlik doğrulama', 'Avrupa Birliği (Frankfurt)'],
              ['Vercel', 'Barındırma; izin verilirse anonim ziyaret analitiği', 'Küresel uç ağı'],
            ],
          },
        ],
      },
      {
        heading: 'Verilerinizi silme',
        blocks: [
          {
            type: 'p',
            text: 'Stüdyolar öğrenci, eğitmen ve kurs kayıtlarını panelden silebilir. Hesabınızın veya stüdyonuzun tüm verilerinin silinmesini istiyorsanız bize yazın; talebiniz doğrulandıktan sonra veriler silinir, yasal saklama yükümlülüğü olan kayıtlar hariç.',
          },
        ],
      },
      {
        heading: 'Değişiklikler',
        blocks: [
          { type: 'p', text: 'Bu politikayı güncellediğimizde sayfanın başındaki tarihi değiştiririz. Önemli değişiklikleri hesap sahiplerine ayrıca bildiririz.' },
        ],
      },
    ],
  },

  terms: {
    title: 'Kullanım Şartları',
    description: 'StudioDesk hizmetini kullanma koşulları.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Taraflar ve kapsam',
        blocks: [
          {
            type: 'p',
            text: `Bu şartlar, ${COMPANY.name} tarafından sunulan ${COMPANY.product} hizmetini kullanan stüdyolar ve onların kullanıcıları için geçerlidir. Hizmeti kullanarak bu şartları kabul etmiş olursunuz. Stüdyo ile yapılan ayrı bir sözleşme veya sipariş formu varsa, çelişen konularda o belge önceliklidir.`,
          },
        ],
      },
      {
        heading: 'Hesaplar',
        blocks: [
          {
            type: 'ul',
            items: [
              'Hesaplar stüdyo adına açılır; stüdyo sahibi ekibine rol vererek kullanıcı ekleyebilir.',
              'Giriş bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz kullanım fark ederseniz hemen bize bildirin.',
              'Bir hesabı yalnızca ona tanımlanan kişi kullanmalıdır.',
            ],
          },
        ],
      },
      {
        heading: 'Stüdyonun sorumlulukları',
        blocks: [
          {
            type: 'ul',
            items: [
              'Panele girdiğiniz öğrenci ve eğitmen verileri için veri sorumlusu sizsiniz; bu kişileri aydınlatmak ve gerekli hukuki sebebe sahip olmak sizin sorumluluğunuzdadır.',
              'Hizmeti hukuka aykırı amaçlarla, başkalarının haklarını ihlal edecek şekilde veya sistemin güvenliğini tehlikeye atacak biçimde kullanamazsınız.',
              'Fiyat, paket ve kredi kurallarınızı siz belirlersiniz; bunların doğruluğu sizin sorumluluğunuzdadır.',
            ],
          },
        ],
      },
      {
        heading: 'Hizmetin sunulması',
        blocks: [
          {
            type: 'p',
            text: 'Hizmeti makul özenle ve kesintisiz sunmaya çalışırız; ancak bakım, güncelleme veya altyapı sağlayıcılarından kaynaklanan kesintiler olabilir. Planlı bakımları mümkün olduğunca önceden duyururuz. Özellikleri geliştirme ve değiştirme hakkımız saklıdır; temel bir özelliği kaldıracaksak önceden bildiririz.',
          },
        ],
      },
      {
        heading: 'Ücretler',
        blocks: [
          {
            type: 'p',
            text: 'Ücretli kullanımın kapsamı, bedeli ve ödeme koşulları stüdyo ile yapılan teklif veya sipariş formunda belirlenir. Ödemesi geciken hesaplarda bildirimde bulunduktan sonra erişimi kısıtlayabiliriz; bu durumda verileriniz silinmez.',
          },
        ],
      },
      {
        heading: 'Fikri mülkiyet',
        blocks: [
          {
            type: 'p',
            text: `${COMPANY.product} yazılımı, tasarımı ve markası ${COMPANY.name}'a aittir. Panele girdiğiniz veriler sizindir; bu verileri yalnızca hizmeti sunmak için kullanırız.`,
          },
        ],
      },
      {
        heading: 'Sorumluluğun sınırı',
        blocks: [
          {
            type: 'p',
            text: 'Kanunun izin verdiği ölçüde, dolaylı zararlardan ve kâr kaybından sorumlu değiliz. Toplam sorumluluğumuz, zarara yol açan olaydan önceki 12 ayda hizmet için ödediğiniz tutarla sınırlıdır. Kast ve ağır ihmal halleri bu sınırlamanın dışındadır.',
          },
        ],
      },
      {
        heading: 'Sona erme',
        blocks: [
          {
            type: 'p',
            text: 'Hizmeti dilediğiniz zaman bırakabilirsiniz. Şartların ağır ihlali halinde hesabı askıya alabilir veya kapatabiliriz. Sona ermeden sonra talep ederseniz verilerinizi dışa aktarmanız için makul bir süre tanırız.',
          },
        ],
      },
      {
        heading: 'Uygulanacak hukuk',
        blocks: [{ type: 'p', text: 'Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır. Uyuşmazlıklarda İstanbul mahkemeleri ve icra daireleri yetkilidir; tüketiciler için kanunun öngördüğü tüketici hakem heyetleri ve mahkemelerin yetkisi saklıdır.' }],
      },
    ],
  },

  cookies: {
    title: 'Çerez Politikası',
    description: 'StudioDesk sitesinde kullanılan çerezler ve tercihlerinizi nasıl yöneteceğiniz.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Kullandığımız çerezler',
        blocks: [
          {
            type: 'p',
            text: 'Yalnızca hizmetin çalışması için gerekli çerezleri ve tarayıcı depolamasını kullanırız. Reklam veya profil çıkarma çerezi kullanmayız.',
          },
          {
            type: 'table',
            head: ['Ad', 'Tür', 'Amaç', 'Süre'],
            rows: [
              ['sb-…-auth-token', 'Gerekli (çerez)', 'Oturumunuzu açık tutar ve hesabınızı doğrular (Supabase)', 'Oturum boyunca; çıkışta silinir'],
              ['organization_id', 'Gerekli (çerez)', 'Birden fazla stüdyoya üyeyseniz seçili stüdyoyu hatırlar', '7 gün'],
              ['NEXT_LOCALE', 'Gerekli (çerez)', 'Seçtiğiniz dili hatırlar', 'Tarayıcı oturumu boyunca'],
              ['studiodesk-consent', 'Gerekli (tarayıcı depolaması)', 'Çerez tercihinizi hatırlar', '1 yıl'],
            ],
          },
        ],
      },
      {
        heading: 'Analitik (yalnızca izin verirseniz)',
        blocks: [
          {
            type: 'p',
            text: 'İzin verirseniz, tanıtım sayfalarında (ana sayfa, blog, yasal sayfalar) Vercel Web Analytics ile anonim ziyaret istatistikleri tutarız. Bu araç çerez kullanmaz ve sizi siteler arasında takip etmez; ziyaretler kimliğiniz belirlenemeyecek şekilde sayılır. Panelde, yönetim ekranlarında ve giriş sayfasında analitik hiç çalışmaz.',
          },
        ],
      },
      {
        heading: 'Tercihlerinizi yönetme',
        blocks: [
          {
            type: 'ul',
            items: [
              'Sayfanın altındaki "Çerez tercihleri" bağlantısından izninizi istediğiniz zaman verebilir veya geri çekebilirsiniz.',
              'Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Gerekli çerezleri engellerseniz giriş yapamaz ve dil tercihiniz hatırlanmaz.',
            ],
          },
        ],
      },
    ],
  },

  'distance-sales': {
    title: 'Mesafeli Satış ve İade Koşulları',
    description: 'StudioDesk aboneliklerinin satış, cayma ve iade koşulları.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Satıcı',
        blocks: [controllerTable],
      },
      {
        heading: 'Konu ve kapsam',
        blocks: [
          {
            type: 'p',
            text: `Bu metin, ${COMPANY.product} yazılım hizmetinin uzaktan iletişim araçlarıyla satışına ilişkin koşulları açıklar. Hizmet esas olarak dans, pilates, yoga, dövüş sanatları, müzik ve benzeri alanlarda ders veren stüdyolara, yani ticari veya mesleki amaçla hareket eden alıcılara sunulur; bu durumda teklif veya sipariş formunda yazılı koşullar uygulanır. Alıcının 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında tüketici olduğu hallerde Mesafeli Sözleşmeler Yönetmeliği hükümleri ayrıca geçerlidir.`,
          },
        ],
      },
      {
        heading: 'Hizmet, bedel ve ödeme',
        blocks: [
          {
            type: 'p',
            text: 'Hizmetin kapsamı (kullanıcı ve şube sayısı, süre), toplam bedel, vergiler ve ödeme şekli sipariş öncesinde alıcıya yazılı olarak bildirilir ve siparişin onaylanmasıyla sözleşme kurulur. Abonelik, sipariş formunda belirtilen dönem için geçerlidir ve aksi bildirilmedikçe aynı koşullarla yenilenir.',
          },
        ],
      },
      {
        heading: 'İfa',
        blocks: [
          { type: 'p', text: 'Hizmet, ödemenin alınmasının ardından en geç 3 iş günü içinde hesabın açılması ve alıcıya giriş bilgilerinin iletilmesiyle ifa edilmeye başlanır.' },
        ],
      },
      {
        heading: 'Cayma hakkı (tüketiciler için)',
        blocks: [
          {
            type: 'p',
            text: 'Tüketici alıcı, sözleşmenin kurulduğu günden itibaren 14 gün içinde gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildirimi yukarıdaki iletişim bilgilerine yazılı olarak yapılır. Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, cayma süresi dolmadan tüketicinin onayıyla ifasına başlanan hizmetlerde cayma hakkı kullanılamaz; bu durumda hesap açılmadan önce alıcıdan ayrıca onay alınır.',
          },
        ],
      },
      {
        heading: 'İade',
        blocks: [
          {
            type: 'ul',
            items: [
              'Cayma hakkının geçerli şekilde kullanılması halinde ödenen bedel, bildirimin ulaşmasından itibaren 14 gün içinde, ödemenin yapıldığı yöntemle iade edilir.',
              'Ticari alıcılar için iade koşulları sipariş formunda belirlenir. Abonelik dönemi başladıktan sonra kullanılmayan süre için iade yapılmaz; aboneliğin yenilenmemesi için dönem sonundan önce bildirim yeterlidir.',
              'Hizmetin bizden kaynaklanan sebeplerle sunulamaması halinde, sunulamayan süreye ait bedel iade edilir.',
            ],
          },
        ],
      },
      {
        heading: 'Uyuşmazlık',
        blocks: [
          {
            type: 'p',
            text: 'Tüketiciler, Ticaret Bakanlığı\'nca her yıl ilan edilen parasal sınırlar dahilinde yerleşim yerlerindeki tüketici hakem heyetlerine veya tüketici mahkemelerine başvurabilir. Ticari alıcılar için İstanbul mahkemeleri ve icra daireleri yetkilidir.',
          },
        ],
      },
    ],
  },
}
