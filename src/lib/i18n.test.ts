import { describe, expect, it } from 'vitest';

import { type GetAvailableLocales, I18N, LocalNotFoundError } from './i18n.js';

describe(I18N.name, () => {
  const locales = {
    en: {
      bar: 'foo {bar} baz',
      foo: 'bar',
      nested: {
        child: 'child',
      },
    },
    fr: {
      bar: 'foo {bar} baz',
      foo: 'bar',
      nested: {
        child: 'enfant',
      },
    },
  } as const;
  const defaultLocaleIdentifier = 'en' satisfies keyof typeof locales;
  const i18n = new I18N(locales, defaultLocaleIdentifier);

  describe('get availableLocales', () => {
    it('should get the available locales', () => {
      expect(i18n.availableLocales).toEqual(new Set(Object.keys(locales)));
    });
  });

  describe('get defaultLocale', () => {
    it('should get the default locale', () => {
      expect(i18n.defaultLocale).toBe(defaultLocaleIdentifier);
    });
  });

  describe('constructor', () => {
    it('should throw an error if the default locale identifier is not in the locales object', () => {
      // Arrange
      const defaultLocaleIdentifier = 'cn' as GetAvailableLocales<typeof i18n>;

      // Act
      const act = () => new I18N(locales, defaultLocaleIdentifier);

      // Assert
      expect(act).toThrowError(LocalNotFoundError);
    });

    it('should not throw an error if the default locale identifier is in the locales object', () => {
      // Arrange
      const defaultLocaleIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;

      // Act
      const act = () => new I18N(locales, defaultLocaleIdentifier);

      // Assert
      expect(act).not.toThrow(LocalNotFoundError);
    });
  });

  describe('getCanonicalPathname()', () => {
    it('should get the canonical pathname from a pathname that is localized', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const canonical = '/foo';
      const pathname = `/${localeIdentifier}${canonical}`;

      // Act
      const result = i18n.getCanonicalPathname(pathname);

      // Assert
      expect(result).toBe(canonical);
    });

    it('should not get the canonical pathname from a pathname that is not localized', () => {
      // Arrange
      // The 'cn' locale is not in the locales object, as such it is not considered localized.
      const pathname = '/cn/foo';

      // Act
      const result = i18n.getCanonicalPathname(pathname);

      // Assert
      expect(result).toBe(pathname);
    });
  });

  describe('getLocaleIdentifierFromPathname()', () => {
    it('should get the locale identifier from the pathname', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const pathname = `/${localeIdentifier}/foo`;

      // Act
      const result = i18n.getLocaleIdentifierFromPathname(pathname);

      // Assert
      expect(result).toBe(localeIdentifier);
    });

    it('should not get the locale identifier from a pathname that starts with the same characters as a locale identifier', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const pathname = `/${localeIdentifier}foo`;

      // Act
      const result = i18n.getLocaleIdentifierFromPathname(pathname);

      // Assert
      expect(result).toBe(null);
    });

    it('should not get the locale identifier from a pathname that does not start with a locale identifier', () => {
      // Arrange
      const pathname = '/foo';

      // Act
      const result = i18n.getLocaleIdentifierFromPathname(pathname);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('localize()', () => {
    it('should localize the strings for the given locale identifier', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;

      // Act
      const localizer = i18n.localize(localeIdentifier);
      const result = localizer.foo();

      // Assert
      expect(result).toEqual(locales.en.foo);
    });

    it('should throw an error if the locale identifier is not in the locales object', () => {
      // Arrange
      const localeIdentifier = 'cn' as GetAvailableLocales<typeof i18n>;

      // Act
      const act = () => i18n.localize(localeIdentifier);

      // Assert
      expect(act).toThrowError(LocalNotFoundError);
    });

    it('should localize the strings with the given values', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const values = { bar: 'baz' };

      // Act
      const localizer = i18n.localize(localeIdentifier);
      const result = localizer.bar(values);

      // Assert
      expect(result).toBe(`foo ${values.bar} baz`);
    });

    it('should localize the nested strings', () => {
      // Arrange
      const localIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;

      // Act
      const localizer = i18n.localize(localIdentifier);
      const result = localizer.nested.child();

      // Assert
      expect(result).toBe(locales.en.nested.child);
    });
  });

  describe('localizePathname()', () => {
    it('should localize the pathname if not already localized', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const pathname = '/foo';

      // Act
      const result = i18n.localizePathname(pathname, localeIdentifier);

      // Assert
      expect(result).toBe(`/${localeIdentifier}${pathname}`);
    });

    it('should localize the pathname if already localized', () => {
      // Arrange
      const localeIdentifier = 'en' satisfies GetAvailableLocales<typeof i18n>;
      const canonicalPathname = '/foo';
      const pathname = `/fr${canonicalPathname}`;

      // Act
      const result = i18n.localizePathname(pathname, localeIdentifier);

      // Assert
      expect(result).toBe(`/${localeIdentifier}${canonicalPathname}`);
    });

    it('should throw an error if the locale identifier is not in the locales object', () => {
      // Arrange
      const localeIdentifier = 'cn' as GetAvailableLocales<typeof i18n>;
      const pathname = '/foo';

      // Act
      const act = () => i18n.localizePathname(pathname, localeIdentifier);

      // Assert
      expect(act).toThrowError(LocalNotFoundError);
    });
  });
});
