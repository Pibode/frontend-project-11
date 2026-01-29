import * as yup from "yup";

// Создаем схему валидации с кастомными сообщениями через i18next
export const createSchema = (i18n) => {
  // Настраиваем yup для текущего языка
  yup.setLocale({
    mixed: {
      required: () => i18n.t("validation.required"),
    },
    string: {
      url: () => i18n.t("validation.url"),
    },
  });

  return yup
    .string()
    .required()
    .url()
    .test(
      "is-rss",
      () => i18n.t("validation.rss"), // Используем функцию для ленивой загрузки
      (value) => {
        const rssPattern = /\.(rss|xml|atom)$/i;
        const containsRss = /rss|feed|atom/i.test(value);
        return rssPattern.test(value) || containsRss;
      },
    );
};

// Функция валидации URL
export const validateUrl = async (url, feeds, i18n) => {
  const schema = createSchema(i18n);

  // Добавляем проверку на уникальность
  const uniqueSchema = schema.test(
    "unique",
    () => i18n.t("validation.unique"),
    (value) => !feeds.includes(value),
  );

  return uniqueSchema.validate(url);
};

// Экспортируем также для обратной совместимости
export const validateUrlOld = (url, feeds) => {
  const rssUrlSchema = yup
    .string()
    .required("Не должно быть пустым")
    .url("Ссылка должна быть валидным URL")
    .test("is-rss", "Ссылка должна быть на RSS ленту", (value) => {
      const rssPattern = /\.(rss|xml)$/i;
      const containsRss = /rss/i.test(value);
      return rssPattern.test(value) || containsRss;
    });

  return rssUrlSchema
    .test("unique", "RSS уже существует", (value) => !feeds.includes(value))
    .validate(url);
};
