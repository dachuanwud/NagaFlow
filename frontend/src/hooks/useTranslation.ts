import { zhCN } from '../locales/zh-CN';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// 替换参数占位符
function interpolate(template: string, params: TranslationParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export function useTranslation() {
  const t = (key: TranslationKey, params?: TranslationParams): string => {
    const value = getNestedValue(zhCN, key);
    return interpolate(value, params);
  };

  return { t };
}

// 导出类型以供其他组件使用
export type { TranslationKey, TranslationParams };
