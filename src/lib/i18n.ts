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

type Accessor<TValue extends string> = (args?: Record<string, unknown>) => TValue;
type DeepStringObject = { [key: string]: DeepStringObject | string };
type LocalizedStrings<TLocale extends DeepStringObject> = {
  [K in keyof TLocale]: TLocale[K] extends string
    ? Accessor<TLocale[K]>
    : TLocale[K] extends DeepStringObject
      ? LocalizedStrings<TLocale[K]>
      : never;
};

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
   * The cached locales.
   */
  readonly #cachedLocales: Map<TAvailableLocales, LocalizedStrings<TLocaleObject>> = new Map();
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
      throw new LocalNotFoundError(defaultLocaleIdentifier);
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
  localize(locale: TAvailableLocales): LocalizedStrings<TLocaleObject> {
    if (!this.#availableLocalesIdentifiers.has(locale)) {
      throw new LocalNotFoundError(locale);
    }

    // If a cached locale already exists, return it.
    if (this.#cachedLocales.has(locale)) {
      return this.#cachedLocales.get(locale)!;
    }

    const localizedStrings = this.#createLocalizedStrings(this.#localesObject[locale]);

    this.#cachedLocales.set(locale, localizedStrings);

    return localizedStrings;
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
      throw new LocalNotFoundError(locale);
    }

    const canonicalPathname = this.getCanonicalPathname(pathname);
    const segments = canonicalPathname.split('/');

    segments.splice(1, 0, locale);

    return segments.join('/');
  }

  /**
   * Create the localized strings.
   *
   * @param object The object to create the localized strings from.
   * @returns The localized strings.
   */
  #createLocalizedStrings<TObject extends DeepStringObject>(
    object: TObject,
  ): LocalizedStrings<TObject> {
    return Object.fromEntries(
      Object.entries(object).map(
        ([key, value]) =>
          [
            key,
            typeof value === 'string'
              ? (args: Record<string, unknown> = {}) =>
                  Object.entries(args).reduce(
                    (accumulator, [argKey, argValue]) =>
                      accumulator.replaceAll(`{${argKey}}`, String(argValue)),
                    value,
                  )
              : this.#createLocalizedStrings(value),
          ] as const,
      ),
    ) as LocalizedStrings<TObject>;
  }
}

export class LocalNotFoundError extends Error {
  constructor(localeIdentifier: string) {
    super(`The key '${localeIdentifier}' was not found in the locales object.`);

    this.name = LocalNotFoundError.name;
  }
}
