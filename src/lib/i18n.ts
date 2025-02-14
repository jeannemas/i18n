/**
 * Get the available locales type from the given I18N type.
 *
 * @template TI18N The I18N type.
 * @returns The available locales from the given I18N type.
 */
export type GetAvailableLocales<TI18N extends I18N> =
  TI18N extends I18N<DeepStringObject, infer TAvailableLocales> ? TAvailableLocales : never;
/**
 * Get the locale object type from the given I18N type.
 *
 * @template TI18N The I18N type.
 * @returns The locale object type from the given I18N type.
 */
export type GetLocale<TI18N extends I18N> = TI18N extends I18N<infer TLocale> ? TLocale : never;

type DeepStringObject = { [key: string]: DeepStringObject | string };

/**
 * An I18N manager.
 *
 * @template TLocaleObject The locale object type.
 * @template TAvailableLocales The available locales type.
 * @template TDefaultLocale The default locale identifier.
 */
export class I18N<
  TLocaleObject extends DeepStringObject = DeepStringObject,
  TAvailableLocales extends string = string,
  TDefaultLocale extends TAvailableLocales = TAvailableLocales,
> {
  /**
   * The available locales.
   */
  get availableLocales(): Set<TAvailableLocales> {
    return new Set(this.#availableLocalesIdentifiers);
  }

  /**
   * The default locale identifier.
   */
  get defaultLocale(): TDefaultLocale {
    return this.#defaultLocaleIdentifier;
  }

  /**
   * The available locales identifiers.
   */
  readonly #availableLocalesIdentifiers: Set<TAvailableLocales>;
  /**
   * The default locale identifier.
   */
  readonly #defaultLocaleIdentifier: TDefaultLocale;
  /**
   * The locales object.
   */
  readonly #localesObject: Record<TAvailableLocales, TLocaleObject>;

  /**
   * Create a new I18N manager.
   *
   * @param locales The locales object.
   * @param defaultLocaleIdentifier The default locale identifier.
   */
  constructor(
    locales: Record<TAvailableLocales, TLocaleObject>,
    defaultLocaleIdentifier: TDefaultLocale,
  ) {
    this.#localesObject = locales;
    this.#availableLocalesIdentifiers = new Set(
      Object.keys(this.#localesObject) as TAvailableLocales[],
    );

    if (!this.#availableLocalesIdentifiers.has(defaultLocaleIdentifier)) {
      throw new LocaleNotFoundError(defaultLocaleIdentifier);
    }

    this.#defaultLocaleIdentifier = defaultLocaleIdentifier;
  }

  /**
   * Get the canonical pathname from a given URL's pathname
   *
   * @param pathname The pathname to get the canonical pathname from.
   * @returns The canonical pathname from the pathname.
   */
  getCanonicalPathname(pathname: string): string {
    const locale = this.getLocaleIdentifierFromPathname(pathname);

    if (locale === null) {
      // If no locale is found, return the original pathname.
      return pathname;
    }

    const segments = pathname.split('/');

    segments.splice(1, 1); // Remove the locale segment.

    return segments.join('/');
  }

  /**
   * Get the locale identifier from an URL's pathname.
   *
   * @param pathname The pathname to get the locale from.
   * @returns The locale identifier from the URL or null if no locale identifier is found.
   */
  getLocaleIdentifierFromPathname(pathname: string): null | TAvailableLocales {
    const segments = pathname.split('/');
    const [, localeSegment] = segments;

    if ((this.#availableLocalesIdentifiers as Set<string>).has(localeSegment)) {
      return localeSegment as TAvailableLocales;
    }

    return null;
  }

  /**
   * Get the localization for the given locale.
   *
   * @param locale The locale to get the localization for.
   * @returns The localization for the given locale.
   */
  localize(locale: TAvailableLocales): TLocaleObject {
    if (!this.#availableLocalesIdentifiers.has(locale)) {
      throw new LocaleNotFoundError(locale);
    }

    return this.#localesObject[locale];
  }

  /**
   * Localize the given URL's pathname with the given locale.
   *
   * @param pathname The pathname to localize.
   * @param locale The locale to localize the pathname with.
   * @returns The localized pathname.
   */
  localizePathname(pathname: string, locale: TAvailableLocales): string {
    if (!this.#availableLocalesIdentifiers.has(locale)) {
      throw new LocaleNotFoundError(locale);
    }

    const canonicalPathname = this.getCanonicalPathname(pathname);
    const segments = canonicalPathname.split('/');

    segments.splice(1, 0, locale);

    return segments.join('/');
  }
}

export class LocaleNotFoundError extends Error {
  constructor(localeIdentifier: string) {
    super(`The key '${localeIdentifier}' was not found in the locales object.`);

    this.name = LocaleNotFoundError.name;

    Error.captureStackTrace?.(this, LocaleNotFoundError);
  }
}
