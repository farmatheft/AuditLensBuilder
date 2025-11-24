import { createContext, useContext, useState, ReactNode } from 'react';
// Uzbek, Estonian, Lithuanian, Latvian, Romanian, Serbian, Polish, Spanish, Bulgarian
import en from './locales/en';
import uk from './locales/uk';
import ru from './locales/ru';
import kk from './locales/kk';
import uz from './locales/uz';
import et from './locales/et';
import lt from './locales/lt';


// Import other languages using the same structure as en
const lv = { ...en, nav: { projects: "Projekti", gallery: "Galerija", settings: "Iestatījumi" }, settings: { title: "Iestatījumi", language: "Valoda", selectLanguage: "Izvēlieties valodu" } };
const ro = { ...en, nav: { projects: "Proiecte", gallery: "Galerie", settings: "Setări" }, settings: { title: "Setări", language: "Limbă", selectLanguage: "Selectați limba" } };
const sr = { ...en, nav: { projects: "Пројекти", gallery: "Галерија", settings: "Подешавања" }, settings: { title: "Подешавања", language: "Језик", selectLanguage: "Изаберите језик" } };
const pl = { ...en, nav: { projects: "Projekty", gallery: "Galeria", settings: "Ustawienia" }, settings: { title: "Ustawienia", language: "Język", selectLanguage: "Wybierz język" } };
const es = { ...en, nav: { projects: "Proyectos", gallery: "Galería", settings: "Configuración" }, settings: { title: "Configuración", language: "Idioma", selectLanguage: "Seleccione idioma" } };
const bg = { ...en, nav: { projects: "Проекти", gallery: "Галерия", settings: "Настройки" }, settings: { title: "Настройки", language: "Език", selectLanguage: "Изберете език" } };

export const translations = { en, uk, ru, kk, uz, et, lt, lv, ro, sr, pl, es, bg };
export type Language = keyof typeof translations;
export type TranslationKeys = typeof en;

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        // Fallback to English if translation is missing
        if (!value) {
            let fallback: any = translations.en;
            for (const k of keys) {
                fallback = fallback?.[k];
            }
            return fallback || key;
        }

        return value || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider');
    }
    return context;
}

export const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
    { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'et', name: 'Eesti', flag: '🇪🇪' },
    { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'sr', name: 'Српски', flag: '🇷🇸' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'bg', name: 'Български', flag: '🇧🇬' },
] as const;
