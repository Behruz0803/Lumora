"""Server-side translations for generated text (English, Uzbek, Russian).

Only text that the server *writes* is localised here: offer eligibility reasons,
the recommendation explanation, disclaimers and the rule-based assistant answers.
Product data itself is translated in the client from the English demo dataset.

The key is the English source template, so a missing translation always falls
back to English text instead of leaking a raw key.
"""
from __future__ import annotations

SUPPORTED_LANGUAGES = ("en", "uz", "ru")
DEFAULT_LANGUAGE = "en"

TRANSLATIONS: dict[str, dict[str, str]] = {
    "uz": {
        # --- eligibility reasons ------------------------------------------------
        "Invalid price data": "Narx ma’lumoti noto‘g‘ri",
        "Currently out of stock": "Hozir omborda yo‘q",
        "No stock available": "Omborda mavjud emas",
        "Minimum order is {minimum} units (requested {requested})":
            "Minimal buyurtma {minimum} birlik (so‘ralgan {requested})",
        "Only {available} units available (requested {requested})":
            "Faqat {available} birlik mavjud (so‘ralgan {requested})",
        "Eligible - low stock ({available} units left)":
            "Mos keladi - kam zaxira ({available} birlik qoldi)",
        "Eligible - in stock": "Mos keladi - zaxirada bor",
        # --- explanation --------------------------------------------------------
        "No supplier can currently fulfil {quantity} {unit} of {product}. All offers are out of stock, below the minimum order quantity, or short on stock.":
            "Hozir hech bir ta’minotchi {product} mahsulotidan {quantity} {unit} miqdorini bajarа olmaydi. Barcha takliflar omborda yo‘q, minimal buyurtmadan kam yoki zaxira yetarli emas.",
        "The closest option is {supplier} ({reason}).": "Eng yaqin variant — {supplier} ({reason}).",
        "Recommended: {supplier} - {quantity} {unit} x {unit_price} UZS = {product_cost} UZS product cost + {delivery} UZS delivery = {total} UZS total ({per_unit} UZS per {unit} delivered).":
            "Tavsiya etiladi: {supplier} — {quantity} {unit} x {unit_price} UZS = {product_cost} UZS mahsulot narxi + {delivery} UZS yetkazib berish = jami {total} UZS (yetkazilgan {unit} uchun {per_unit} UZS).",
        "It is {difference} UZS ({percent}%) cheaper than the next option, {supplier} ({total} UZS).":
            "Bu keyingi variant {supplier} ({total} UZS)dan {difference} UZS ({percent}%) arzonroq.",
        "It is the only offer that can fulfil this quantity, so there is no alternative to compare against.":
            "Bu miqdorni bajaradigan yagona taklif, shuning uchun taqqoslash uchun muqobil yo‘q.",
        "This supplier includes free delivery, which is why the higher unit price still wins on total cost.":
            "Bu ta’minotchi bepul yetkazib beradi — shuning uchun yuqoriroq birlik narxi baribir umumiy xarajatda yutadi.",
        "Its unit price is not the lowest, but free or cheaper delivery makes the total cost the lowest.":
            "Birlik narxi eng past emas, lekin bepul yoki arzon yetkazib berish umumiy xarajatni eng past qiladi.",
        "Other eligible options: {breakdown}.": "Boshqa mos variantlar: {breakdown}.",
        "Compared with the most expensive eligible option ({supplier}, {total} UZS), choosing {best} saves {saved} UZS on this order.":
            "Eng qimmat mos variant ({supplier}, {total} UZS) bilan taqqoslaganda, {best} ni tanlash bu buyurtmada {saved} UZS tejaydi.",
        "Best overall on quality and delivery is {supplier} ({rating}/5 rating, {days} day delivery) at {total} UZS, a {premium} UZS premium.":
            "Sifat va yetkazib berish bo‘yicha eng yaxshisi — {supplier} ({rating}/5 reyting, {days} kun yetkazib berish), {total} UZS, ya’ni {premium} UZS ustama.",
        "Best overall on quality and delivery is {supplier} ({rating}/5 rating, {days} day delivery) at {total} UZS.":
            "Sifat va yetkazib berish bo‘yicha eng yaxshisi — {supplier} ({rating}/5 reyting, {days} kun yetkazib berish), {total} UZS.",
        "{count} offer(s) were excluded because they cannot fulfil the requested quantity or are out of stock.":
            "{count} taklif so‘ralgan miqdorni bajara olmagani yoki omborda yo‘qligi uchun chiqarildi.",
        "(free delivery)": "(bepul yetkazib berish)",
        "({delivery} UZS delivery)": "({delivery} UZS yetkazib berish)",
        "No supplier offers exist for this product yet.": "Bu mahsulot uchun hozircha takliflar yo‘q.",
        "All PriceRadar data is fictional demo data.":
            "PriceRadar’dagi barcha ma’lumotlar uydirma demo ma’lumotlardir.",
        # --- assistant ----------------------------------------------------------
        "I can compare supplier offers and calculate total purchasing costs including delivery. Try naming a product from the demo catalogue ({catalogue}) and a quantity, for example: '100 kg of potatoes'. I run on transparent business rules - no external AI model is connected.":
            "Men ta’minotchi takliflarini taqqoslayman va yetkazib berish bilan umumiy xarid xarajatini hisoblayman. Demo katalogdan ({catalogue}) mahsulot va miqdorni ayting, masalan: “100 kg kartoshka”. Men shaffof biznes qoidalari asosida ishlayman — tashqi AI modeli ulanmagan.",
        "There are no supplier offers for {product} in the demo dataset yet.":
            "Demo ma’lumotlarda {product} uchun hozircha ta’minotchi takliflari yo‘q.",
        "There is no recorded price history for {product} yet.":
            "{product} uchun hozircha narxlar tarixi yo‘q.",
        "Not enough price history for {product} in the last {days} days.":
            "{product} uchun oxirgi {days} kun ichida narxlar tarixi yetarli emas.",
        "Over the last {days} days the average {product} price {direction} from {first} UZS to {last} UZS per {unit} ({percent}%). The observed range was {low} - {high} UZS. This is a simulated demo series, so treat it as an illustration of the product, not a forecast.":
            "Oxirgi {days} kun ichida {product} ning o‘rtacha narxi {unit} uchun {first} UZS dan {last} UZS gacha {direction} ({percent}%). Kuzatilgan diapazon: {low} — {high} UZS. Bu simulyatsiya qilingan demo qator, uni prognoz emas, mahsulot namoyishi deb qabul qiling.",
        "increased": "oshdi",
        "decreased": "tushdi",
        "stayed flat": "o‘zgarmadi",
        "I cannot find a supplier that can fulfil {quantity} {unit} of {product}. Reasons - {reasons}.":
            "{product} mahsulotidan {quantity} {unit} ni bajara oladigan ta’minotchi topilmadi. Sabablar — {reasons}.",
        "At {quantity} {unit}{note}, {supplier} gives the lowest total cost of {total} UZS.":
            "{quantity} {unit}{note} uchun eng past umumiy xarajat — {supplier}: {total} UZS.",
        "Choosing it instead of the most expensive eligible offer saves {saved} UZS on this order.":
            "Uni eng qimmat mos taklif o‘rniga tanlash bu buyurtmada {saved} UZS tejaydi.",
        "It is also the only eligible offer, so there is nothing to save against.":
            "Bu yagona mos taklif, shuning uchun tejash uchun taqqoslash imkoni yo‘q.",
        "Supplier options for {product} at {quantity} {unit}{note}:":
            "{product} uchun {quantity} {unit}{note} bo‘yicha ta’minotchi variantlari:",
        "Best total cost: {supplier} at {total} UZS. Contact details are fictional demo data.":
            "Eng past umumiy xarajat: {supplier}, {total} UZS. Aloqa ma’lumotlari uydirma demo ma’lumotdir.",
        "At {quantity} {unit}{note}, {available} of {total} suppliers can fulfil your order.":
            "{quantity} {unit}{note} uchun {total} ta’minotchidan {available} tasi buyurtmangizni bajara oladi.",
        "For {quantity} {unit} of {product}{note}, the lowest total cost is {total} UZS from {supplier} ({unit_price} UZS/{unit} x {quantity} = {product_cost} UZS + {delivery} UZS delivery).":
            "{product} mahsulotidan {quantity} {unit}{note} uchun eng past umumiy xarajat — {supplier}: {total} UZS ({unit_price} UZS/{unit} x {quantity} = {product_cost} UZS + {delivery} UZS yetkazib berish).",
        "If you value quality and delivery speed over the last few percent of price, {supplier} is the best overall option.":
            "Agar narxning oxirgi foizlaridan ko‘ra sifat va tezkorlik muhim bo‘lsa, {supplier} — umumiy eng yaxshi variant.",
        " (I assumed {quantity} {unit} - tell me the real quantity and I will recalculate.)":
            " ({quantity} {unit} deb hisobladim — aniq miqdorni ayting, qayta hisoblayman.)",
        "- {supplier} ({location}, {rating}/5, {verification}, {days} day delivery, {phone}): {unit_price} UZS/{unit} + {delivery} UZS delivery":
            "— {supplier} ({location}, {rating}/5, {verification}, {days} kun yetkazib berish, {phone}): {unit_price} UZS/{unit} + {delivery} UZS yetkazib berish",
        " = {total} UZS for {quantity} {unit}": " = {quantity} {unit} uchun {total} UZS",
        " - not eligible ({reason})": " — mos emas ({reason})",
        "{supplier}: {available} {unit} available, minimum order {minimum} {unit}, delivery in {days} day(s)":
            "{supplier}: {available} {unit} mavjud, minimal buyurtma {minimum} {unit}, yetkazib berish {days} kun",
        "verified": "tasdiqlangan",
        "not verified": "tasdiqlanmagan",
        # suggestions
        "Compare potatoes for 100 kg": "100 kg kartoshkani taqqosla",
        "What is the cheapest way to buy 50 kg of rice?": "50 kg guruchni eng arzon qanday sotib olaman?",
        "Which supplier should I choose for 20 kg of tomatoes?": "20 kg pomidor uchun qaysi ta’minotchini tanlay?",
        "Show the price trend for cooking oil": "O‘simlik yog‘i narx tendensiyasini ko‘rsat",
        "Compare {product} for 100 {unit}": "{product} ni 100 {unit} uchun taqqosla",
        "Which supplier is best for {product}?": "{product} uchun qaysi ta’minotchi eng yaxshi?",
        "Compare {product} for 20 {unit}": "{product} ni 20 {unit} uchun taqqosla",
        "Show all suppliers": "Barcha ta’minotchilarni ko‘rsat",
        "Compare {product} at a different quantity": "{product} ni boshqa miqdorda taqqosla",
        "Save this offer": "Bu taklifni saqlash",
        "Show price trend": "Narx tendensiyasini ko‘rsat",
        "Which supplier is cheapest for {product}?": "{product} uchun qaysi ta’minotchi eng arzon?",
        "Show the price trend for {product}": "{product} narx tendensiyasini ko‘rsat",
        "What if I order 250 {unit}?": "Agar 250 {unit} buyurtma qilsam-chi?",
        "Save the cheapest offer": "Eng arzon taklifni saqlash",
    },
    "ru": {
        # --- eligibility reasons ------------------------------------------------
        "Invalid price data": "Некорректные данные о цене",
        "Currently out of stock": "Сейчас нет в наличии",
        "No stock available": "Нет на складе",
        "Minimum order is {minimum} units (requested {requested})":
            "Минимальный заказ — {minimum} ед. (запрошено {requested})",
        "Only {available} units available (requested {requested})":
            "Доступно только {available} ед. (запрошено {requested})",
        "Eligible - low stock ({available} units left)":
            "Подходит — мало на складе (осталось {available} ед.)",
        "Eligible - in stock": "Подходит — в наличии",
        # --- explanation --------------------------------------------------------
        "No supplier can currently fulfil {quantity} {unit} of {product}. All offers are out of stock, below the minimum order quantity, or short on stock.":
            "Сейчас ни один поставщик не может выполнить заказ на {quantity} {unit} товара «{product}». Все предложения отсутствуют на складе, ниже минимального заказа или с недостаточным запасом.",
        "The closest option is {supplier} ({reason}).": "Ближайший вариант — {supplier} ({reason}).",
        "Recommended: {supplier} - {quantity} {unit} x {unit_price} UZS = {product_cost} UZS product cost + {delivery} UZS delivery = {total} UZS total ({per_unit} UZS per {unit} delivered).":
            "Рекомендуется: {supplier} — {quantity} {unit} × {unit_price} UZS = {product_cost} UZS стоимость товара + {delivery} UZS доставка = итого {total} UZS ({per_unit} UZS за {unit} с доставкой).",
        "It is {difference} UZS ({percent}%) cheaper than the next option, {supplier} ({total} UZS).":
            "Это на {difference} UZS ({percent}%) дешевле следующего варианта — {supplier} ({total} UZS).",
        "It is the only offer that can fulfil this quantity, so there is no alternative to compare against.":
            "Это единственное предложение, способное выполнить такой объём, поэтому сравнивать не с чем.",
        "This supplier includes free delivery, which is why the higher unit price still wins on total cost.":
            "Этот поставщик включает бесплатную доставку — поэтому более высокая цена за единицу всё равно выигрывает по общей стоимости.",
        "Its unit price is not the lowest, but free or cheaper delivery makes the total cost the lowest.":
            "Цена за единицу не самая низкая, но бесплатная или более дешёвая доставка делает общую стоимость минимальной.",
        "Other eligible options: {breakdown}.": "Другие подходящие варианты: {breakdown}.",
        "Compared with the most expensive eligible option ({supplier}, {total} UZS), choosing {best} saves {saved} UZS on this order.":
            "По сравнению с самым дорогим подходящим вариантом ({supplier}, {total} UZS) выбор {best} экономит {saved} UZS на этом заказе.",
        "Best overall on quality and delivery is {supplier} ({rating}/5 rating, {days} day delivery) at {total} UZS, a {premium} UZS premium.":
            "Лучший в целом по качеству и доставке — {supplier} ({rating}/5, доставка {days} дн.) за {total} UZS, надбавка {premium} UZS.",
        "Best overall on quality and delivery is {supplier} ({rating}/5 rating, {days} day delivery) at {total} UZS.":
            "Лучший в целом по качеству и доставке — {supplier} ({rating}/5, доставка {days} дн.) за {total} UZS.",
        "{count} offer(s) were excluded because they cannot fulfil the requested quantity or are out of stock.":
            "{count} предложений исключено: они не могут выполнить запрошенный объём или отсутствуют на складе.",
        "(free delivery)": "(бесплатная доставка)",
        "({delivery} UZS delivery)": "(доставка {delivery} UZS)",
        "No supplier offers exist for this product yet.": "Для этого товара пока нет предложений.",
        "All PriceRadar data is fictional demo data.": "Все данные PriceRadar — вымышленные демо-данные.",
        # --- assistant ----------------------------------------------------------
        "I can compare supplier offers and calculate total purchasing costs including delivery. Try naming a product from the demo catalogue ({catalogue}) and a quantity, for example: '100 kg of potatoes'. I run on transparent business rules - no external AI model is connected.":
            "Я сравниваю предложения поставщиков и рассчитываю общую стоимость закупки с учётом доставки. Назовите товар из демо-каталога ({catalogue}) и количество, например: «100 кг картофеля». Я работаю по прозрачным бизнес-правилам — внешняя ИИ-модель не подключена.",
        "There are no supplier offers for {product} in the demo dataset yet.":
            "В демо-данных пока нет предложений поставщиков на «{product}».",
        "There is no recorded price history for {product} yet.":
            "История цен для «{product}» пока не записана.",
        "Not enough price history for {product} in the last {days} days.":
            "Недостаточно истории цен для «{product}» за последние {days} дн.",
        "Over the last {days} days the average {product} price {direction} from {first} UZS to {last} UZS per {unit} ({percent}%). The observed range was {low} - {high} UZS. This is a simulated demo series, so treat it as an illustration of the product, not a forecast.":
            "За последние {days} дн. средняя цена «{product}» {direction} с {first} UZS до {last} UZS за {unit} ({percent}%). Наблюдаемый диапазон: {low} — {high} UZS. Это смоделированный демо-ряд: воспринимайте его как иллюстрацию, а не прогноз.",
        "increased": "выросла",
        "decreased": "снизилась",
        "stayed flat": "не изменилась",
        "I cannot find a supplier that can fulfil {quantity} {unit} of {product}. Reasons - {reasons}.":
            "Ни один поставщик не может выполнить заказ на {quantity} {unit} товара «{product}». Причины — {reasons}.",
        "At {quantity} {unit}{note}, {supplier} gives the lowest total cost of {total} UZS.":
            "Для {quantity} {unit}{note} наименьшая общая стоимость — у {supplier}: {total} UZS.",
        "Choosing it instead of the most expensive eligible offer saves {saved} UZS on this order.":
            "Если выбрать его вместо самого дорогого подходящего предложения, экономия на заказе — {saved} UZS.",
        "It is also the only eligible offer, so there is nothing to save against.":
            "Это также единственное подходящее предложение, поэтому сравнивать не с чем.",
        "Supplier options for {product} at {quantity} {unit}{note}:":
            "Варианты поставщиков по товару «{product}» на {quantity} {unit}{note}:",
        "Best total cost: {supplier} at {total} UZS. Contact details are fictional demo data.":
            "Наименьшая общая стоимость: {supplier}, {total} UZS. Контактные данные — вымышленные демо-данные.",
        "At {quantity} {unit}{note}, {available} of {total} suppliers can fulfil your order.":
            "Для {quantity} {unit}{note} заказ могут выполнить {available} из {total} поставщиков.",
        "For {quantity} {unit} of {product}{note}, the lowest total cost is {total} UZS from {supplier} ({unit_price} UZS/{unit} x {quantity} = {product_cost} UZS + {delivery} UZS delivery).":
            "Для заказа «{product}» на {quantity} {unit}{note} наименьшая общая стоимость — {total} UZS у {supplier} ({unit_price} UZS/{unit} × {quantity} = {product_cost} UZS + {delivery} UZS доставка).",
        "If you value quality and delivery speed over the last few percent of price, {supplier} is the best overall option.":
            "Если качество и скорость доставки важнее последних процентов цены, {supplier} — лучший вариант в целом.",
        " (I assumed {quantity} {unit} - tell me the real quantity and I will recalculate.)":
            " (Я предположил {quantity} {unit} — укажите реальное количество, и я пересчитаю.)",
        "- {supplier} ({location}, {rating}/5, {verification}, {days} day delivery, {phone}): {unit_price} UZS/{unit} + {delivery} UZS delivery":
            "— {supplier} ({location}, {rating}/5, {verification}, доставка {days} дн., {phone}): {unit_price} UZS/{unit} + {delivery} UZS доставка",
        " = {total} UZS for {quantity} {unit}": " = {total} UZS за {quantity} {unit}",
        " - not eligible ({reason})": " — не подходит ({reason})",
        "{supplier}: {available} {unit} available, minimum order {minimum} {unit}, delivery in {days} day(s)":
            "{supplier}: доступно {available} {unit}, минимальный заказ {minimum} {unit}, доставка {days} дн.",
        "verified": "проверен",
        "not verified": "не проверен",
        # suggestions
        "Compare potatoes for 100 kg": "Сравнить картофель на 100 кг",
        "What is the cheapest way to buy 50 kg of rice?": "Как дешевле всего купить 50 кг риса?",
        "Which supplier should I choose for 20 kg of tomatoes?": "Какого поставщика выбрать для 20 кг помидоров?",
        "Show the price trend for cooking oil": "Показать динамику цен на растительное масло",
        "Compare {product} for 100 {unit}": "Сравнить «{product}» на 100 {unit}",
        "Which supplier is best for {product}?": "Какой поставщик лучше для «{product}»?",
        "Compare {product} for 20 {unit}": "Сравнить «{product}» на 20 {unit}",
        "Show all suppliers": "Показать всех поставщиков",
        "Compare {product} at a different quantity": "Сравнить «{product}» в другом количестве",
        "Save this offer": "Сохранить это предложение",
        "Show price trend": "Показать динамику цен",
        "Which supplier is cheapest for {product}?": "Какой поставщик дешевле для «{product}»?",
        "Show the price trend for {product}": "Показать динамику цен на «{product}»",
        "What if I order 250 {unit}?": "А если заказать 250 {unit}?",
        "Save the cheapest offer": "Сохранить самое дешёвое предложение",
    },
}


# Demo dataset names that appear inside generated sentences.
DATA_NAMES: dict[str, dict[str, str]] = {
    "uz": {
        "Potatoes": "Kartoshka",
        "Tomatoes": "Pomidor",
        "Onions": "Piyoz",
        "Rice": "Guruch",
        "Flour": "Un",
        "Cooking oil": "O‘simlik yog‘i",
        "Sugar": "Shakar",
        "Eggs": "Tuxum",
        "Vegetables": "Sabzavotlar",
        "Grains": "Don mahsulotlari",
        "Oils & Fats": "Yog‘lar",
        "Pantry": "Oziq-ovqat zaxirasi",
        "Dairy & Eggs": "Sut va tuxum",
        "Tashkent": "Toshkent",
        "Fergana": "Farg‘ona",
        "Samarkand": "Samarqand",
        "Bukhara": "Buxoro",
        "Andijan": "Andijon",
        "Namangan": "Namangan",
        "kg": "kg",
        "l": "l",
        "tray": "patnis",
        "unit": "dona",
    },
    "ru": {
        "Potatoes": "Картофель",
        "Tomatoes": "Помидоры",
        "Onions": "Лук",
        "Rice": "Рис",
        "Flour": "Мука",
        "Cooking oil": "Растительное масло",
        "Sugar": "Сахар",
        "Eggs": "Яйца",
        "Vegetables": "Овощи",
        "Grains": "Крупы и злаки",
        "Oils & Fats": "Масла и жиры",
        "Pantry": "Бакалея",
        "Dairy & Eggs": "Молочное и яйца",
        "Tashkent": "Ташкент",
        "Fergana": "Фергана",
        "Samarkand": "Самарканд",
        "Bukhara": "Бухара",
        "Andijan": "Андижан",
        "Namangan": "Наманган",
        "kg": "кг",
        "l": "л",
        "tray": "лоток",
        "unit": "шт",
    },
}


def localise(language: str, value: str) -> str:
    """Translate a demo dataset label (product, category, city, unit) inside prose."""
    return DATA_NAMES.get(language, {}).get(value, value)


def normalise_language(value: str | None) -> str:
    """Reduce an Accept-Language header or profile value to a supported code."""
    if not value:
        return DEFAULT_LANGUAGE
    first = value.split(",")[0].strip().split(";")[0].strip().lower()
    base = first.split("-")[0]
    return base if base in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def resolve_language(header: str | None = None, fallback: str | None = None) -> str:
    """Pick the response language: explicit header first, then profile, then English."""
    if header:
        candidate = normalise_language(header)
        if candidate in SUPPORTED_LANGUAGES:
            return candidate
    if fallback:
        return normalise_language(fallback)
    return DEFAULT_LANGUAGE


def t(language: str, key: str, **values: object) -> str:
    """Translate a source template into `language`, falling back to English."""
    template = TRANSLATIONS.get(language, {}).get(key, key)
    if not values:
        return template
    try:
        return template.format(**values)
    except (KeyError, IndexError):  # pragma: no cover - defensive
        return template
