import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAlarmConfig from '../public/locales/en/alarmConfig.json'
import enAlarms from '../public/locales/en/alarms.json'
import enCommon from '../public/locales/en/common.json'
import enEvents from '../public/locales/en/events.json'
import enMerchantConfig from '../public/locales/en/merchantConfig.json'
import enMerchants from '../public/locales/en/merchants.json'

import zhAlarmConfig from '../public/locales/zh/alarmConfig.json'
import zhAlarms from '../public/locales/zh/alarms.json'
import zhCommon from '../public/locales/zh/common.json'
import zhEvents from '../public/locales/zh/events.json'
import zhMerchantConfig from '../public/locales/zh/merchantConfig.json'
import zhMerchants from '../public/locales/zh/merchants.json'

const resources = {
  en: {
    alarmConfig: enAlarmConfig,
    alarms: enAlarms,
    common: enCommon,
    events: enEvents,
    merchantConfig: enMerchantConfig,
    merchants: enMerchants,
  },
  zh: {
    alarmConfig: zhAlarmConfig,
    alarms: zhAlarms,
    common: zhCommon,
    events: zhEvents,
    merchantConfig: zhMerchantConfig,
    merchants: zhMerchants,
  },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: [
      'alarmConfig',
      'alarms',
      'common',
      'events',
      'merchantConfig',
      'merchants',
    ],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export default i18n
