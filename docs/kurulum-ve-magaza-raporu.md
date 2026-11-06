# Event Week: Kurulum, mevcut durum ve mağaza yolu

Bu metin, uygulamayı telefona kurmayı ve ileride Google Play ile App Store’a koymayı hiç bilmeyen birine anlatır. Teknik kelime geçtiğinde hemen yanında sade anlamı da vardır.

Tarih: 6 Kasım 2026.

---

## 1. Uygulama nedir, parçaları neler?

Üç parça birlikte çalışır.

1. **Telefon uygulaması.** Katılımcının telefonuna kurulur. Expo ile hazırlanır. Expo, telefon uygulamasını bulutta derleyip kurulabilir dosya üreten hizmettir.
2. **Yönetim paneli.** Organizatörün tarayıcıdan açtığı site. Etkinlik, duyuru, çekiliş, simge ve uygulama adı buradan yönetilir.
3. **Sunucu.** Panelin ve telefonun konuştuğu adres. Katılımcı listesi, paylaşımlar ve ayarlar burada durur.

Şu an telefon, şu adrese bağlanır:

`http://xcnmst8cowlxzcnc24jgwofs.76.13.14.253.sslip.io/api`

Bu adres geçici bir deneme adresidir. Başında `https` değil `http` vardır. Mağazaya çıkmadan önce kalıcı bir alan adı ve kilitli (`https`) bağlantı gerekir. Nedeni aşağıda, eksikler bölümündedir.

---

## 2. Şu an nerede duruyoruz?

### Telefonda çalışanlar

Katılımcı telefon numarasıyla giriş yapar. Numara bir etkinliğe denk gelirse o etkinliğin adı ve logosu görünür.

Altta üç sekme vardır: **Feed**, **Menü**, **Profilim**.

Menüden açılanlar:

- Program, konuşmacılar, duyurular, galeri
- Aktiviteler, uçuşlar, konaklama, dokümanlar, notlar
- Canlı quiz, çekiliş, anket, oylama, randevu
- Ayarlar
- Transfer yalnızca belirli bir deneme etkinliğinde görünür. Her etkinlikte otomatik açılmaz.

Ayrıca:

- Akışta fotoğraf ve video paylaşımı, birden fazla görsel, beğeni ve yorum
- Hikâyeler. Soldan önceki, sağdan sonraki hikâyeye geçilir
- Panelden açılan çekilişi telefondan izleme
- Panelden akış, hikâye ve yorumu açıp kapatma
- Ana ekran adı ve simgesi panelden kaydedilir, yeni derlemede telefona işlenir. Canlıda kayıtlı ad **The Micer** idi
- Profilde oturum, randevu, oy ve aktivite sayıları

### Henüz mağazada değil

Android deneme dosyası (APK) Expo üzerinden indirilip elle kurulur. Play Store’da veya App Store’da yayın yoktur.

iOS derlemesi hiç tamamlanmadı. Apple geliştirici hesabı ve giriş bilgisi olmadığı için iPhone’a kurulacak dosya üretilemez. Bu bilgi uydurulamaz; hesabı sizin açmanız gerekir.

### Son GitHub kaydı

Kod adresi: https://github.com/bafybaf/event-week

Son gönderilen kayıt: `24dc873`.  
Expo hesabı: `bafybaf06`.  
Expo proje numarası: `1569b470-2b00-4408-b31c-73172ece9800`.

---

## 3. Eksikler

Mağazaya koymadan önce düzelmesi gerekenler, önem sırasıyla:

1. **Kalıcı ve kilitli adres.** Şimdiki adres `http` ile başlıyor ve IP benzeri bir deneme adı. Apple, şifresiz `http` bağlantıyı genelde reddeder. Google de veri güvenliği formunda bunu sorar. Kalıcı alan adı alınmalı, kilit (`https`) açılmalı, telefon uygulamasındaki adres buna çevrilmelidir.
2. **Paket adı hâlâ yer tutucu.** Hem Android hem iOS kimliği `com.yourcompany.eventweek` yazıyor. Bu, “şirketiniz.eventweek” anlamına gelen boş bir örnektir. İlk mağaza yüklemesinden sonra bu ad **bir daha değiştirilemez**. Yayınlamadan önce size ait gerçek bir ad seçilmelidir. Örnek biçim: `com.sirketadi.etkinlik`.
3. **Play için doğru dosya türü yok.** Şu anki üretim ayarı Android’de APK üretir. Play Store yeni uygulamalarda APK değil **AAB** ister. AAB, Google’ın telefona göre paketlediği derleme türüdür. Bu ayar değişmeden Play’e yüklenemez.
4. **iPhone hesabı yok.** Apple Geliştirici Programı yıllık ücretlidir. Hesap açılmadan iPhone derlemesi, TestFlight ve App Store adımı başlamaz.
5. **Bildirimler telefona gitmez.** Kodda duyuru bildirimi vardır ama Android’in zorunlu bildirim dosyası (`google-services.json`) projede yoktur. Kayıtlı cihaz anahtarı da oluşmamıştır. Panelden “bildirim gönder” dense bile telefon çalmaz.
6. **Gizlilik sayfası yok.** İki mağaza da herkese açık bir gizlilik metni adresi ister. Telefon numarası, fotoğraf ve bildirim toplandığı için bu metin şarttır.
7. **QR okutma tamamlanmış sayılmaz.** Profilde QR gösterme vardır. Kapıda okutunca “bu kişi bu oturuma geldi” kaydı tutan akış henüz gerçek bir yoklama değildir.
8. **Profildeki “oturum” sayısı kişisel katılım değildir.** Etkinlikteki oturum adedini sayar. Kişinin tek tek hangi oturuma girip çıktığını tutmaz.
9. **E-posta gönderimi yok.** Ayarlarda e-posta bildirimi diye çalışan bir gönderici yoktur.
10. **Mağaza görselleri hazır değil.** Ekran görüntüsü, 512 piksel ikon, kısa açıklama, destek adresi ve deneme katılımcısı henüz mağaza formuna konmamıştır.
11. **İnceleme hesabı.** Giriş telefon numarasıyla olur. Apple ve Google incelemecisine çalışan bir deneme numarası verilmezse uygulama reddedilebilir.

Bilerek yapılmayanlar:

- Apple ile giriş yok. Hesap olmadığı için eklenmedi.
- Simge, logo değildir. Panelde ayrı yüklenen kare simge kullanılır.

---

## 4. Bugün Android telefona kurmak

Bu yol mağaza değildir. Yalnızca deneme APK’sidir.

1. Bilgisayarda, proje klasöründeki `mobile-app` içinden derleme başlatılır.  
   Komut: `npx eas-cli build --platform android --profile preview --non-interactive`
2. Expo dosyayı bulutta üretir. Hesap normal öncelikte olduğu için sıra bazen kısa, bazen yirmi dakika kadar sürebilir. Asıl derleme yaklaşık on beş dakikadır.
3. Biten işin sayfası `expo.dev` üzerinde açılır. Oradaki APK bağlantısı indirilir.
4. Dosya telefona gönderilir.
5. Telefonda “bilinmeyen kaynaklardan kuruluma izin ver” denir. Bu izin yalnızca bu deneme içindir. Play’den inen uygulamada bu adım olmaz.
6. APK’ye dokunulur, kurulur, açılır.
7. Kayıtlı telefon numarası yazılır. Numara paneldeki bir katılımcıyla eşleşirse etkinlik açılır.

Ana ekrandaki ad ve simge, derleme başladığı anda panelde kayıtlı olan değerden alınır. Panelde sonradan değişirse, telefonda ancak **yeni bir derleme** kurulunca değişir.

Eski APK’nin üstüne kurmak için aynı imza gerekir. Expo’daki mevcut anahtar kullanılırsa güncelleme olur. Başka bir bilgisayarda üretilmiş farklı imzalı APK, eskisinin üzerine kurulamaz. O zaman eski uygulama silinip yenisi kurulur.

---

## 5. Bugün iPhone’a kurmak neden olmuyor?

Android’de APK dosyasını elle kurabilirsiniz. iPhone buna izin vermez.

iPhone’a uygulama üç yoldan biri ile gelir:

- App Store
- Apple’ın deneme sistemi TestFlight
- Geliştirici hesabına kayıtlı, sınırlı sayıda cihaz

Üçü de Apple Geliştirici Programı ister. Hesap, sertifika ve iPhone paket adı hazır olmadan Expo iOS derlemesi başlatılsa da kimlik doğrulama adımında durur. Bu yüzden şu ana kadar iOS paketi yoktur.

---

## 6. Expo ne işe yarar, derleme nasıl ilerler?

Expo’yu şöyle düşünün: sizin bilgisayarınızda Android Studio veya Xcode kurmadan, Expo’nun bilgisayarları uygulamayı paketler.

Sırası:

1. Kod GitHub’da durur. Derleme, o anki klasörün bir kopyasını Expo’ya yükler.
2. Expo, “preview” veya “production” profiline bakar.
   - **Preview:** iç deneme. Android’de APK çıkar. Mağazaya konmaz.
   - **Production:** mağaza niyeti. Bugün bu profil de APK üretiyor. Play için AAB’ye çevrilmesi gerekir.
3. Derleme sırasında bir betik çalışır. Panelden uygulama adını ve kare simgeyi indirir, telefona gömülecek simgeleri yeniden üretir.
4. Android anahtarı Expo’da saklıdır. Aynı hesapla üretilen APK’ler birbiriyle uyumludur.
5. İş bitince indirme bağlantısı oluşur. Bağlantı bir süre sonra Expo tarafında süresi dolabilir. Kalıcı dağıtım mağazadır, Expo bağlantısı değil.

Derleme kuyruğu sizin kodunuz yavaş diye uzamaz. Expo’nun ortak makinelerinde sıra varsa beklersiniz. Üretim işleminin kendisi bu uygulamada yaklaşık on beş dakikadır.

---

## 7. Play Store: baştan sona

Google Play, Android mağazasıdır. Aşağıdaki sıra atlanmamalıdır.

### 7.1 Hesabı almak

Kaynak: [Play Console’a başlama](https://support.google.com/googleplay/android-developer/answer/6112435) ve [hesap türü seçimi](https://support.google.com/googleplay/android-developer/answer/13634885). Aşağıdaki ücret ve belgeler bu sayfalarda yazanlardır. Türkiye lirası karşılığı sayfada yoktur; ödeme ekranı karttan ne keseceğini gösterir.

1. Bir Google hesabı açın. Play Console bu hesaba bağlanır.
2. [Play Console kayıt sayfasına](https://play.google.com/console/signup) bu hesapla girin.
3. Geliştirici Dağıtım Sözleşmesi’ni kabul edin.
4. Kayıt ücretini ödeyin. Google’ın yazdığı ücret **bir kez 25 ABD dolarıdır**. Yıllık değildir. Kabul edilen kartlar: Mastercard, Visa, American Express, ABD’de Discover, ABD dışında Visa Electron. Google, ön ödemeli kart kabul etmez. Kartın geçip geçmeyeceği ülkeye göre değişir.
5. Hesap türünü seçin. Bu seçim sonraki doğrulamayı belirler.
   - **Kişisel hesap:** öğrenci, hobi veya kendi adınıza yayın. Mağazada görünen ad sizin yasal adınızdır. 13 Kasım 2023’ten sonra açılan kişisel hesaplar, herkese açmadan önce aşağıdaki 12 testçi şartını tamamlar. Ayrıca kişisel hesap sahibi, yayınlamadan önce Play Console mobil uygulamasıyla bir Android telefona eriştiğini doğrular.
   - **Kuruluş hesabı:** şirket, meslek faaliyeti veya kamu. Mağazada kuruluşun yasal adı görünür. D-U-N-S numarası zorunludur. Devlet kurumu D-U-N-S alamıyorsa kayıt sırasında destekten doğrulama ister. Finans, sağlık, VPN ve kamu uygulamaları kuruluş hesabı olmadan açılamaz. Bu etkinlik uygulaması o dört sınıfta değildir. Yine de şirket adı görünsün istiyorsanız kuruluş hesabı seçilir.
6. Ödeme profilini bağlayın. Varsa eskisini seçin, yoksa Play Console yenisini açtırır. Profil türü, kişisel veya kuruluş seçiminize göre değişir.
7. Kimliği doğrulayın. Google’ın [kimlik doğrulama sayfası](https://support.google.com/googleplay/android-developer/answer/10841920) şunları ister:
   - Kişisel hesapta, ödeme profili daha önce doğrulanmadıysa resmi kimlik belgesi.
   - Kuruluş hesabında D-U-N-S, resmi kimlik ve kuruluş belgesi. Belge, şirketin hâlen var olduğunu gösteren resmi bir sicil kaydı olmalıdır. Üzerindeki ad, Dun & Bradstreet kaydındaki adla aynı olmalıdır.
8. Dun & Bradstreet üzerinden D-U-N-S başvurusu Google’ın yazdığına göre ücretsizdir. Bu iş için yüksek ücret isteyen aracı sitelere gerek yoktur.

Doğrulama bitmeden uygulama herkese açılamaz. Eksik veya yanlış kimlik, kaydı durdurur.

### 7.2 Uygulamayı Console’da açmak

1. “Uygulama oluştur” denir.
2. Uygulama adı yazılır. Telefonda görünen ad paneldeki adla aynı olmak zorunda değildir; mağaza adı ayrıca yazılır. Yine de ikisinin aynı olması karışıklığı önler.
3. Uygulama mı oyun mu, ücretsiz mi, soruları işaretlenir. Bu uygulama ücretsiz bir uygulamadır.
4. Beyanlar (geliştirici program politikaları) kabul edilir.

### 7.3 Paket adını kilitlemek

İlk AAB yüklenmeden önce projedeki Android paket adı gerçek şirkete ait adla değiştirilir. Örnek: `com.yourcompany.eventweek` kalırsa mağazada da o görünür ve sonra düzeltilemez.

Bu değişiklikten sonra yeni bir production derlemesi gerekir. Eski deneme APK’si ile mağaza sürümü aynı paket adını taşıyorsa güncelleme gibi kurulur. Paket adı değişirse telefon bunu yeni bir uygulama sanır.

### 7.4 AAB üretmek

1. `eas.json` içindeki production Android ayarı APK yerine `app-bundle` yapılır.
2. Sunucu adresi `https` olur.
3. Şu komut çalışır:  
   `npx eas-cli build --platform android --profile production`
4. Expo, Play’in istediği `.aab` dosyasını verir.
5. İmzalama anahtarı Expo’da duruyorsa Play App Signing ile eşlenir. İlk yüklemede Console, Google’ın da imzalamasını ister. Bunu kabul etmek normaldir. Google, kullanıcılara giden son imzayı tutar. Sizin anahtarınız yükleme anahtarı olarak kalır.

### 7.5 Mağaza kartı

Console’da “Mağaza girişi” doldurulur:

- Uygulama adı
- Kısa açıklama
- Tam açıklama
- Uygulama simgesi, 512×512 piksel
- Telefon ekran görüntüleri. Gerçek uygulamadan alınır, en az iki adet
- Özellik grafiği. Play’in istediği geniş banner
- Uygulama türü ve kategori (etkinlik / iş)
- E-posta adresi. Herkese görünür destek adresi
- Gizlilik politikası bağlantısı. Boş sayfa kabul edilmez. Metinde telefon numarası, profil fotoğrafı, galeri, bildirim ve etkinlik verisinin nerede durduğu yazılır

### 7.6 Zorunlu formlar

Sırayla:

1. **Uygulama erişimi.** Giriş zorunlu olduğu için incelemeciye bir deneme telefon numarası ve ne yapacağı yazılır.
2. **Reklam.** Reklam yoksa “hayır” denir.
3. **İçerik derecelendirmesi.** Anket doldurulur. Sonuç yaş sınırı olarak karta yazılır.
4. **Hedef kitle.** Uygulama çocuklara yönelik değilse bu açıkça işaretlenir.
5. **Veri güvenliği.** Toplanan veriler işaretlenir: telefon numarası, ad, fotoğraf, yaklaşık kullanım. Verinin sunucuya gittiği ve hesabın silinip silinemediği dürüstçe yazılır.
6. **İzinler.** Kamera, galeri ve bildirim varsa her birinin nedeni kısaca yazılır. Kullanılmayan izinler projeden çıkarılır. Şu an depoda eski depolama ve mikrofon izinleri de duruyor. Mağaza incelemesinde “neden var?” diye sorulabilir.

### 7.7 Deneme hattı, sonra herkes

Kaynak: [Yeni kişisel hesapların test şartı](https://support.google.com/googleplay/android-developer/answer/14151465) ve [açık, kapalı ve iç test](https://support.google.com/googleplay/android-developer/answer/9845334). Test hatlarının ayrıca bir Google ücreti yoktur.

Google dört hattı şöyle ayırır:

1. **İç test.** Güvendiğiniz küçük gruba sürüm verir. Uygulama kurulumu bitmeden de kullanılabilir. İsteğe bağlıdır. Google, eklenen sürümün testçilere normalde saniyeler içinde düştüğünü yazar.
2. **Kapalı test.** Sizin seçtiğiniz kişiler görür. Liste e-posta listesi veya Google Grup ile tutulur. Bir geliştirici hesabında en fazla 200 e-posta listesi, bir hatta en fazla 50 liste açılır. Her listede en fazla 2.000 kişi olur. Google Grup için bu üst sınır yazılmaz.
3. **Açık test.** Uygulamanın deneme sürümü Play’de görünür, isteyen katılır. Bu hat, üretime çıkma izninden sonra açılır.
4. **Üretim.** Uygulama Play’de herkese açılır.

13 Kasım 2023’ten sonra açılmış **kişisel** hesapta üretim izni için şart şudur:

- Kapalı testte en az 12 kişi uygulamaya kayıtlı olmalıdır.
- Bu 12 kişi, üretim iznine başvurduğunuz anda, kesintisiz son 14 gündür kayıtlı olmalıdır.
- 14 günü doldurmadan çıkan kişi sayılmaz. Çıkıp tekrar girerse 14 gün yeniden, ara vermeden işlemelidir.
- Şart dolunca Console’daki panodan üretim erişimi istenir. Google, uygulamanın ne olduğu, testin nasıl yapıldığı ve yayına hazır olup olmadığını sorar.

Kuruluş hesapları bu 12 kişi ve 14 gün şartının dışındadır. Bunu kişisel hesap açıp sonra “şirketiz” diyerek atlamak, Google’ın hesap türü sayfasına uymaz. Hesap türü kayıtta seçilir ve doğrulama buna göre kilitlenir.

Teste katılmak için testçinin Google hesabı veya Google Workspace hesabı olmalıdır. Kapalı veya açık testte uygulama ücretliyse testçi de satın alır. Bu uygulama ücretsiz olduğu için o durum burada yoktur. İlk test bağlantısının testçiye düşmesi birkaç saat sürebilir. Sonraki güncellemeler de birkaç saat sürebilir. Bu süre Google’ın test sayfasında yazar.

Üretim reddedilirse gerekçe Console’da görünür. Düzeltme yeni bir sürüm numarasıyla yüklenir. Projedeki production profili sürüm numarasını kendisi artıracak şekilde ayarlıdır. Reddin kaç saat veya kaç gün süreceği Google’ın bu sayfalarında sabit bir sayı olarak yazmaz.

---

## 8. App Store: baştan sona

App Store, iPhone mağazasıdır. Play’den bağımsızdır. Android dosyası iPhone’a yaramaz.

### 8.1 Apple geliştirici hesabını almak

Kaynak: [Apple Developer Program](https://developer.apple.com/programs/), [üyelik](https://developer.apple.com/programs/enroll/) ve [kayıt yardımı](https://developer.apple.com/help/account/membership/program-enrollment/). Ücret, belgeler ve satıcı adı bu sayfalardadır. Ödeme ekranında bölgenin para birimi çıkabilir. Apple sabit bir lira fiyatı yayınlamaz. Yayınlanan ücret **yılda 99 ABD dolarıdır**.

İki hesap karıştırılmamalıdır.

- **Ücretsiz Apple hesabı.** Apple kimliğiyle [developer.apple.com](https://developer.apple.com) adresine girip geliştirici sözleşmesini kabul etmek yeter. Xcode, doküman ve kendi cihazınızda Xcode ile deneme bununla olur. App Store, TestFlight ve başkasına dağıtım **yoktur**.
- **Apple Developer Program.** Yıllık 99 ABD doları. TestFlight, App Store ve dağıtım bununla açılır. Bu uygulamanın iPhone sürümü için gereken budur.
- **Apple Developer Enterprise Program.** Yılda 299 ABD doları. Yalnızca şirketin kendi çalışanlarına, mağaza dışı ve kurumsal cihaz yönetimiyle özel dağıtım içindir. App Store yerine geçmez. Bu etkinlik uygulaması katılımcıya App Store’dan gidecekse Enterprise programına yazılmayın.

Kayıt için Apple kimliğinde iki adımlı doğrulama açık olmalıdır. Kayıt olan kişi, bulunduğu yerde reşit olmalıdır. Kayıt, Apple Developer uygulamasından veya web’den yapılır. Apple, Hindistan’da kaydın yalnız uygulama üzerinden olduğunu yazar. Bazı ülkelerde yaptırım nedeniyle kayıt hiç açılmaz.

#### Kişi adına kayıt

1. Apple kimliğindeki ad ve soyad, nüfustaki yasal ad olmalıdır. Takma ad, lakap veya şirket adı yazılırsa onay gecikir.
2. [Kayıt sayfasında](https://developer.apple.com/programs/enroll/) bireysel kayıt seçilir.
3. Apple şunları doğrular: yasal ad, e-posta, telefon, adres. Posta kutusu adresi kabul edilmez.
4. Kişi ve tek kişilik işletme, sözleşmeyi okuyup ücreti kayıt anında ödeyebilir.
5. Kredi kartı size ait olmalıdır. Başkasının kartı kullanılırsa kayıt durur ve resmi fotoğraflı kimlik istenir.
6. Ödeme işlenince onay e-postası gelir. Satın almadan sonra 24 saat içinde üyelik onayı gelmezse Apple’a yazılır. İstekte Enrollment ID bulunur. Durum, kayıtta kullanılan Apple kimliğiyle geliştirici sitesine girilerek de görülür.

App Store’da satıcı adı **sizin yasal adınız** olur. Şirket adı görünmez. Tek kişilik işletme de bireysel kayıt olur ve yine yasal ad görünür. Bireysel hesabı sonradan kuruluş hesabına çevirmek için Apple’a başvurmak gerekir. Bunu kayıt sayfası yazar.

#### Şirket adına kayıt

App Store’da satıcı adı şirketin yasal unvanı olsun istiyorsanız kuruluş kaydı gerekir. Tabeladaki ticari unvan, şube veya hayali ad kabul edilmez. Örnek: satıcı satırı “ABC Company, Inc.” gibi tüzel kişilik adıdır.

Kuruluş kaydında Apple şunları arar:

1. Tüzel kişilik. Sözleşme imzalayabilen şirket, vakıf, ortaklık veya kamu kurumu.
2. D-U-N-S numarası. Dun & Bradstreet’in verdiği 9 haneli iş yeri numarası. Kamu kurumundan istenmez. Çoğu yerde almak ücretsizdir. Numara var mı diye bakılır, yoksa istenir. Apple’ın verdiği yer: kayıt yardımındaki D-U-N-S bağlantısı.
3. Kaydı yapan kişinin şirketi bağlama yetkisi. Sahip, kurucu, üst düzey yönetici, kıdemli proje sorumlusu ya da yetki verilmiş çalışan. Sahip değilseniz, sizin çalışan ve yetkili olduğunuzu doğrulayacak bir referans istenir.
4. Şirket alan adıyla biten iş e-postası.
5. Herkese açık ve dolu bir şirket sitesi. Sosyal medya linki, boş sayfa veya alan adı satıcısının “bu alan park edildi” sayfası kabul edilmez.
6. Gerekirse noter onaylı şirket belgesi. Ülkeye göre noter, belediye veya avukat olabilir. Apple her başvuruda istemez. İsterse ayrıca yazar.

Sıra şöyledir:

1. Apple kimliğini, mümkünse şirket e-postasıyla ve yasal adınızla açın. İki adımlı doğrulama açık olsun.
2. Kuruluş olarak kayıt formunu doldurun. D-U-N-S ve yetki bilgisi buradadır.
3. Ücreti hemen çekmeyin. Apple önce bilgileri doğrular. Doğrulama bitince e-posta gelir. Ancak o e-postadan sonra sözleşme ve yıllık 99 ABD doları ödemesi açılır.
4. Ödeme ve 24 saatlik onay, bireysel kayıttaki gibidir.

Üyelik Apple Developer uygulamasından alındıysa yıllık otomatik yenilenen aboneliktir. İptal edilene kadar yenilenir. Web’den alındıysa ödeme ekranındaki yöntemler geçerlidir. Bölgede vergi varsa Apple, o bölgenin oranını ekler.

Kâr amacı gütmeyen kuruluş, akredite okul veya kamu kurumu, şartları tutuyorsa ücret muafiyeti isteyebilir. Birey, tek kişilik işletme ve uygulama içinde satış yapanlar bu muafiyetin dışındadır. Ayrıntı: [ücret muafiyeti](https://developer.apple.com/help/account/membership/fee-waivers/).

Uygulamayı bir yazılım firması sizin adınıza yapıyorsa Apple’ın kuralı şudur: App Store’da şirket adı görünecekse **şirket** programa kaydolur. Yazılımcı, şirketin ekibine üye olarak eklenir. Uygulamayı incelemeye şirket hesabı gönderir. Yazılımcının kendi bireysel hesabından şirket adına yayınlaması, satıcı adını yazılımcının kişisel adı yapar.

### 8.2 Paket adı

Apple buna Bundle ID der. Uygulamanın iPhone’daki kimliğidir.

1. developer.apple.com içinde Identifiers bölümünde yeni bir Bundle ID açılır.
2. Projedeki `com.yourcompany.eventweek` bununla değiştirilir.
3. Aynı ad Android’de de kullanılabilir. Şart değildir ama karışıklığı azaltır.
4. Bildirim kullanılacaksa bu kimliğe Push Notifications yetkisi eklenir.

### 8.3 Expo’ya Apple girişini vermek

EAS, sertifikayı sizin yerinize üretebilir. Bunun için bir kez Apple hesabıyla giriş gerekir. Giriş sizde olmadan bu adım yapılmaz.

Üretilenler:

- Dağıtım sertifikası. “Bu paketi bu geliştirici yaptı” mührüdür.
- Profil. Hangi uygulamanın hangi sertifikayla çıkacağını söyler.

Bunlar Expo hesabında saklanır. Sonraki iOS derlemelerinde yeniden sorulmaz.

### 8.4 iPhone paketini üretmek

1. Sunucu adresi `https` yapılır. `http` ve “her adrese izin ver” ayarı App Store incelemesinde ret sebebidir. Bu ayar bugün projede açıktır (`NSAllowsArbitraryLoads`).
2. Komut:  
   `npx eas-cli build --platform ios --profile production`
3. Çıkan dosya IPA’dır. iPhone kurulum paketidir.
4. İlk iş için TestFlight seçmek daha doğrudur. TestFlight, Apple’ın sınırlı deneme mağazasıdır. İncelemesi tam mağazadan daha kısa sürer ama yine Apple kontrol eder.

### 8.5 App Store Connect kartı

[App Store Connect](https://appstoreconnect.apple.com) içinde:

1. Yeni uygulama. Ad, dil (Türkçe), Bundle ID, SKU. SKU sizin iç takip kodunuzdur, kullanıcı görmez.
2. Alt başlık, açıklama, anahtar kelimeler, destek adresi, pazarlama adresi (varsa).
3. Gizlilik politikası adresi. Play’deki metnin aynısı kullanılabilir.
4. Yaş derecelendirmesi anketi.
5. Gizlilik etiketi. Apple’ın “hangi veri toplanıyor” tablosu. Telefon numarası, ad, fotoğraf ve kullanıcı kimliği işaretlenir.
6. Ekran görüntüleri. Apple’ın o yıl istediği iPhone boyları. Genelde büyük iPhone ve gerekirse tablet. Görseller gerçek ekrandan alınır. Uydurma montaj ret sebebi olabilir.
7. Uygulama simgesi Connect’e ayrıca yüklenir. Derlemedeki simgeyle aynı olmalıdır.
8. Sürüm notu. İlk sürümde “İlk yayın” yeter.
9. İnceleme notu. Deneme telefon numarası, etkinliğin nasıl açılacağı, çekiliş veya quiz denenecekse panelden kimin açacağı yazılır.
10. Dışa aktarma uyumu. Uygulama özel şifreleme kullanmıyor. Projede bu beyan hazır: `ITSAppUsesNonExemptEncryption` kapalı. Connect’te de “hayır, özel şifreleme yok” denir. HTTPS bunun dışında, normaldir.

### 8.6 Göndermek

1. IPA, EAS submit veya Transporter ile Connect’e yüklenir. Transporter, Apple’ın yükleme programıdır.
2. Build, App Store Connect’te işlenip sürüm sayfasında seçilebilir hale gelince o sürüm işaretlenir. İşlemenin kaç dakika süreceği Apple’ın kayıt sayfalarında sabit bir sayı olarak yazmaz.
3. “İncelemeye gönder” denir.
4. İncelemenin kaç gün süreceği de sabit bir sayı değildir. Sonuç Connect’te ve e-postada görünür.
5. Onaylanınca, sürümde seçtiğiniz yayın biçimine göre uygulama ya hemen çıkar ya da sizin yayınlamanızı bekler.

Sık ret nedenleri, bu proje için:

- İncelemeci giriş yapamaz
- Gizlilik metni yok veya veri formu ile çelişir
- `http` sunucu
- Uygulama açılışta çöker
- Ekran görüntüsü ile gerçek ekran uyuşmaz
- İstenen izin (kamera, fotoğraf) açıklamasızdır

Ret gelirse mesajdaki madde düzeltilir, sürüm numarası artırılarak yeni IPA yüklenir, yeniden gönderilir.

### 8.7 TestFlight ile ekibe vermek

TestFlight, yıllık üyeliğin içindedir. Bunu [program sayfası](https://developer.apple.com/programs/) yazar. Ücretsiz Apple kimliğiyle TestFlight açılmaz.

1. IPA, App Store Connect’e yüklenir.
2. Kimleri davet edeceğiniz Connect’teki TestFlight bölümünden seçilir. İç ekip ile dış deneme aynı şey değildir. Dış katılımcıya açmadan önce Apple’ın Beta incelemesi gerekir. Güncel davet kuralı için Apple’ın kendi sayfası esas alınır: [TestFlight](https://developer.apple.com/testflight/).
3. Davet alan kişi TestFlight’ı kurar ve uygulamayı oradan indirir.
4. TestFlight, mağazanın yerine kalıcı dağıtım değildir. Katılımcıya herkese açık kurulum App Store sürümüdür.

---

## 9. İki mağazayı yan yana

| Konu | Android, Play | iPhone, App Store |
| --- | --- | --- |
| Hesap ücreti | Bir kez 25 ABD doları. Test hatlarına ayrı ücret yok | Yılda 99 ABD doları. Ücretsiz Apple kimliği App Store için yetmez |
| Bugünkü durum | Deneme APK’si var, mağaza yok | Hesap olmadığı için paket yok |
| Yüklenecek dosya | AAB | IPA |
| Elle kurulum | APK ile mümkün | Normal kullanıcıya kapalı |
| Kimlik adı | `package`, bugün yer tutucu | Bundle ID, bugün aynı yer tutucu |
| Zorunlu metin | Gizlilik politikası ve veri formu | Gizlilik politikası ve gizlilik etiketi |
| Deneme | İç test, kapalı test | TestFlight |
| İnceleme süresi | Google bu sayfalarda sabit gün yazmaz | Apple bu sayfalarda sabit gün yazmaz |
| Giriş | Deneme telefon numarası | Aynı numara inceleme notuna yazılır |

---

## 10. Mağazadan önce yapılacak iş listesi

Sıra bozulmasın.

1. Şirkete ait alan adını alın. Sunucuyu `https` ile açın.
2. Telefon uygulamasındaki adresi bu yeni adrese çevirin. `http` serbestisini kapatın.
3. Paket adını `com.yourcompany.eventweek` olmaktan çıkarıp size ait gerçek ad yapın. Bunu ilk mağaza yüklemesinden önce yapın.
4. Gizlilik sayfasını yayınlayın. Adresi hem Play hem App Store formuna yazın.
5. Kullanılmayan izinleri temizleyin. Bildirim kullanılacaksa Android için Firebase bildirim dosyasını ekleyin ve bir telefonda bildirimin geldiğini deneyin.
6. Play Console hesabını açın. Production derlemeyi AAB yapın. İç teste yükleyin.
7. Apple Geliştirici hesabını açın. Bundle ID oluşturun. EAS’e kendi Apple girişinizle bağlayın. TestFlight’a IPA yükleyin.
8. İki mağaza kartına aynı açıklamayı, aynı simgeyi ve çalışan bir deneme numarasını koyun.
9. Denemede giriş, akış, hikâye, quiz ve çekiliş bir kez uçtan uca yürüsün.
10. Ancak ondan sonra herkese açık üretime basın.

Bu liste bitmeden “mağazaya koyduk” denemez. Bugün gelinen yer, Android deneme paketinin Expo’dan indirilmesidir.

---

## 11. Yayınlandıktan sonra güncelleme

İki tür değişiklik vardır. Birincisi mağazaya gitmez. İkincisi yeni paket ister.

### 11.1 Mağaza paketi gerekmeyenler

Bunlar sunucuda ve panelde durur. Telefondaki uygulama açılınca sunucudan okur. Yeni APK veya IPA gerekmez.

- Etkinlik, program, duyuru, galeri, doküman, anket, oylama, randevu
- Akıştaki paylaşımlar, hikâyeler, yorumların açılıp kapanması
- Quiz soruları ve çekilişin sahneden açılması
- Katılımcı listesi ve telefon numarasıyla giriş
- Giriş ekranındaki logo ve, numara bir etkinliğe denk gelmezse, girişte görünen uygulama adı

Panelde kaydetmek yeter. Kullanıcı mağazadan güncelleme yapmaz.

### 11.2 Yeni paket gerekenler

Telefonun içine gömülü olan her şey için Play’e yeni AAB, App Store’a yeni IPA yüklenir.

- Ekran, menü, hata düzeltmesi, yeni sayfa
- Ana ekrandaki simge ve simgenin altındaki ad. İkisi derleme anında panele bakılarak pakete yazılır
- İzinler, bildirim dosyası, sunucu adresinin değişmesi
- Expo veya hazır kütüphane sürümünün değişmesi

Projede `expo-updates` açıktır ama kontrol `NEVER` durur. Yani yüklü uygulama, mağaza dışında kendiliğinden yeni kod indirmez. “Sadece sunucuya gönderelim, telefon kendi alsın” bu ayarla çalışmaz. Mağaza güncellemesi gerekir. Bu ayar sonradan değiştirilse bile simge, izin ve ana ekran adı yine yeni paket ister. O yüzden bugünkü yol mağaza güncellemesidir.

Paket adı ve iPhone Bundle ID güncellemede değiştirilmez. Değişirse mağaza bunu yeni bir uygulama sayar. Eski kurulumun üzerine yazılmaz.

### 11.3 Ortak hazırlık

1. Değişikliği panelde halledebiliyorsanız 11.1’de kalın. Derleme başlatmayın.
2. Kod değişecekse önce deneyin. Android’de eldeki preview APK, mağazadaki sürümün yerine geçmez. Mağaza sürümünü ayrıca production profiliyle üretin.
3. Kullanıcının gördüğü sürüm yazısı `mobile-app/app.json` içindeki `version` alanıdır. Şu an `1.0.0` yazıyor. Yeni yayında bunu `1.0.1`, `1.1.0` gibi bir üst değere çevirin. Bunu elle yapmazsanız mağaza kartında sürüm adı eski kalır.
4. Derleme numarası ayrıdır. Play buna sürüm kodu, Apple derleme numarası der. `eas.json` içinde production profilinde `autoIncrement` açıktır ve numara Expo’da tutulur. `app.json` içindeki `versionCode` bu yüzden yok sayılır. Yeni production derlemesi bu numarayı bir artırır. Sizin ayrıca kod yazmanız gerekmez.
5. Aynı imza kullanılmalıdır. Android anahtarı bu Expo hesabında duruyor. Yeni paketi başka bir hesapta, başka anahtarla imzalamayın. Aksi halde telefon güncellemeyi kurmaz.

### 11.4 Play’de güncelleme

1. Production profili AAB üretir hale getirilmiş olmalıdır. İlk yayında bu yapıldıysa aynı ayarla devam edilir.
2. Komut: `npx eas-cli build --platform android --profile production`
3. Çıkan AAB, Play Console’da aynı uygulamanın üretim hattına yüklenir. Yeni uygulama oluşturulmaz.
4. Sürüm kodu, bir önceki yüklemeden büyük olmalıdır. Bunu `autoIncrement` sağlar. Daha küçük veya aynı kod yüklenmez.
5. “Sürüm notları”na kullanıcının göreceği kısa metin yazılır. Türkçe kart için Türkçe not yazın.
6. İsterseniz önce iç veya kapalı teste aynı AAB’yi koyup bakın. Üretime almak ayrı bir onaydır.
7. Üretime gönderilen güncelleme de incelenir. İncelemenin kaç gün süreceği Google’ın sayfalarında sabit bir sayı değildir.
8. Onaydan sonra, uygulamayı Play’den kurmuş kişiler güncellemeyi Play’den alır. Elle APK kurulmaz.

Elle kurulan deneme APK’si ile Play’den inen uygulama her zaman birbirinin üzerine yazılmaz. Play, kullanıcılara giden paketi kendi imzasıyla da imzalar. İmza deneme APK’sinden farklıysa telefon, Play sürümünü güncelleme saymaz. O kişi uygulamayı silip Play’den yeniden kurar. Bundan sonraki güncellemeler Play üzerinden gelir.

### 11.5 App Store’da güncelleme

1. `app.json` içindeki `version` yayınlanmış sürümden büyük olmalıdır. App Store’da çıkmış `1.0.0` dururken aynı `1.0.0` ile yeni bir yayın sürümü açılmaz. `1.0.1` gibi yeni bir sürüm yazılır.
2. Komut: `npx eas-cli build --platform ios --profile production`
3. Derleme numarası `autoIncrement` ile artar. Aynı sürümün içinde bile derleme numarası eskisinden büyük olmalıdır.
4. IPA, App Store Connect’e yüklenir. Yeni bir uygulama kaydı açılmaz. Aynı uygulamanın yeni sürümü açılır.
5. “What’s New” alanına bu sürümde ne değiştiği yazılır. Türkçe mağaza kartı varsa Türkçe yazın.
6. İncelemeye gönderilir. Güncelleme de incelemeden geçer. Süre için sabit bir gün yazılmaz.
7. Onaylanınca, sürümde seçilen yayın biçimine göre çıkış ya hemen olur ya da sizin basmanızı bekler.
8. Uygulamayı App Store’dan kuran kişi güncellemeyi App Store’dan alır.

TestFlight’a ayrıca bir deneme IPA’sı yüklemek, mağazadaki herkesi güncellemez. Herkese giden paket, incelemeye gönderilip onaylanan sürümdür.

### 11.6 Yayın sonrası kısa kontrol

Güncelleme çıktıktan sonra şunlara bakın:

1. Eski sürümü kurulu bir telefonda mağaza “Güncelle” diyor mu?
2. Güncellemeden sonra giriş, akış ve değiştirdiğiniz ekran açılıyor mu?
3. Ana ekran adı veya simge değiştiyse, mağaza güncellemesi kurulduktan sonra ana ekranda yeni hali görünüyor mu? Kurulmadan görünmez.

---

## 12. Onay için resmi bekleme süreleri

Bunlar mağazaların kendi sayfalarında yazan sürelerdir. Bir başvuruya söz verilen bitiş tarihi değildir. Hesap doğrulamasının kaç gün süreceği bu sayfalarda sabit bir sayı olarak yazmaz.

### Apple, uygulama ve güncelleme incelemesi

Kaynak: [App Review](https://developer.apple.com/distribute/app-review/) ve [inceleme durumu](https://developer.apple.com/help/app-review/after-submitting-for-review/review-status/). 6 Kasım 2026’da bu sayfalarda yazan cümle şudur:

- Gönderilenlerin en az yüzde 50’si 24 saatten kısa sürede incelenir.
- Yüzde 90’ı 48 saatten kısa sürede incelenir.
- Çoğu gönderim 48 saat içinde incelenir.
- Küçük düzeltmeler genelde daha hızlı ilerler.
- İlk kez gönderilen, inceleme geçmişi az olan uygulama daha uzun sürebilir.
- Belge istenen, düzenlemeye tabi veya karmaşık başvuru da uzayabilir.
- Eksik bilgi incelemenin gecikmesine veya reddedilmesine yol açar.

Acil hata veya etkinlik tarihi için hızlandırılmış inceleme istenir. Apple bunu değerlendireceğini yazar. Daha kısa bir süre garanti etmez. Adres: [hızlandırılmış inceleme](https://developer.apple.com/help/app-review/after-submitting-for-review/request-expedited-review/).

### Google Play, uygulama ve güncelleme incelemesi

Kaynak: [Değişikliklerin ne zaman inceleneceği](https://support.google.com/googleplay/android-developer/answer/9859654). 6 Kasım 2026’da sayfada yazan süre:

- İşlem birkaç saat sürebilir.
- Yedi güne kadar çıkabilir.
- Olağanüstü durumda yedi günden uzun sürebilir.
- Google, yayına almadan önce en az bir haftalık pay bırakılmasını önerir.

İnceleme sürerken yeni bir değişiklik gönderirseniz süre son değişiklikten yeniden başlar. Uygulama kuyruğun arkasına düşebilir.

İç test hattı çoğu zaman incelemesiz, yüklemeden hemen sonra testçiye düşer. İki istisna vardır ve ikisinde de süre yine birkaç saat ile yedi gün, olağanüstü durumda daha uzundur:

- Uygulamanın ilk yayını iç test hattındaysa
- Bir önceki gönderim reddedildiyse

Kişisel hesaptaki 12 testçinin 14 gün kayıtlı kalması inceleme süresi değildir. O süre dolmadan üretim izni istenemez. Üretim izninin kendisi ayrıca incelenir. Bu iznin kaç gün süreceği, yukarıdaki test şartı sayfasında sabit bir gün olarak yazmaz.
