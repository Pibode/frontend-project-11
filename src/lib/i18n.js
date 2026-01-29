import i18next from 'i18next';
import * as yup from 'yup';

// Инициализация i18next
const initI18n = () => {
  i18next.init({
    lng: 'ru', // Язык по умолчанию
    debug: process.env.NODE_ENV === 'development',
    resources: {
      ru: {
        translation: {
          // Русские переводы будут добавлены динамически
        }
      },
      en: {
        translation: {
          // Английские переводы будут добавлены динамически
        }
      }
    },
    interpolation: {
      escapeValue: false, // React уже экранирует
    },
  });

  // Настраиваем yup для работы с i18next
  yup.setLocale({
    mixed: {
      required: () => i18next.t('validation.required'),
    },
    string: {
      url: () => i18next.t('validation.url'),
    },
  });

  return i18next;
};

// Функция для загрузки переводов
export const loadTranslations = async (i18nInstance) => {
  // В реальном приложении здесь был бы fetch
  // Но для проекта используем импорт
  const ruTranslations = await import('../locales/ru/translation.json');
  const enTranslations = await import('../locales/en/translation.json');
  
  i18nInstance.addResourceBundle('ru', 'translation', ruTranslations.default);
  i18nInstance.addResourceBundle('en', 'translation', enTranslations.default);
};

export default initI18n;