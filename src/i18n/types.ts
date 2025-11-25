/**
 * i18n Types
 *
 * Type definitions for internationalization system
 */

export type Locale = "pl" | "en";

export const DEFAULT_LOCALE: Locale = "pl";
export const LOCALES: Locale[] = ["pl", "en"];

export interface LocaleConfig {
  code: Locale;
  name: string;
  flag: string;
}

export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  pl: {
    code: "pl",
    name: "Polski",
    flag: "🇵🇱",
  },
  en: {
    code: "en",
    name: "English",
    flag: "🇬🇧",
  },
};

// Translation keys structure (based on pl.json/en.json)
export interface Translations {
  common: {
    app_name: string;
    email: string;
    password: string;
    required: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    confirm: string;
  };
  auth: {
    login_title: string;
    login_subtitle: string;
    login_button: string;
    signup_title: string;
    signup_subtitle: string;
    signup_button: string;
    logout: string;
    no_account: string;
    have_account: string;
    signup_link: string;
    login_link: string;
    forgot_password: string;
    reset_password: string;
    back_to_home: string;
    login_success: string;
    signup_success: string;
    confirm_password: string;
    passwords_must_match: string;
  };
  trips: {
    title: string;
    no_trips: string;
    create_first: string;
    create_new: string;
    destination: string;
    start_date: string;
    end_date: string;
    description: string;
    status: string;
    actions: string;
    view_details: string;
    edit_trip: string;
    delete_trip: string;
    delete_confirm: string;
    delete_success: string;
    save_success: string;
    ai_content: string;
    generate_with_ai: string;
    regenerate_ai: string;
    regenerate_confirm: string;
    generating: string;
    generating_message: string;
    status_draft: string;
    status_generating: string;
    status_completed: string;
    status_failed: string;
    day_singular: string;
    days_few: string;
    days_many: string;
    ai_generated: string;
    created: string;
    no_trips_title: string;
    no_trips_description: string;
    create_new_trip: string;
    pagination_previous: string;
    pagination_next: string;
    pagination_showing: string;
    pagination_to: string;
    pagination_of: string;
    pagination_trips: string;
    pagination_label: string;
    edit: string;
    delete: string;
    deleting: string;
    cancel: string;
    description_heading: string;
    ai_plan_heading: string;
    recommendations_heading: string;
    day_title: string;
    transport: string;
    accommodation: string;
    budget: string;
    best_time: string;
    no_ai_plan: string;
    generate_ai_plan: string;
    generating_ai: string;
    generation_time: string;
    ai_explanation: string;
    ai_failed: string;
    retry: string;
    retrying: string;
    delete_confirm_title: string;
    delete_confirm_message: string;
    error_fetch_trip: string;
    error_fetch_details: string;
    error_not_logged_in: string;
    error_delete_trip: string;
    error_delete_details: string;
    error_session_expired: string;
    error_generate_ai: string;
    error_generate_request: string;
    error_generate_details: string;
    error_trip_not_found: string;
    breadcrumb_start: string;
    breadcrumb_plans: string;
    breadcrumb_details: string;
    page_title: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    my_trips: string;
    profile: string;
    settings: string;
  };
  errors: {
    generic: string;
    network: string;
    unauthorized: string;
    forbidden: string;
    not_found: string;
    validation: string;
    required_field: string;
    invalid_email: string;
    password_too_short: string;
  };
  home: {
    badge: string;
    hero_title_line1: string;
    hero_title_line2: string;
    hero_subtitle: string;
    hero_description: string;
    cta_create: string;
    cta_how_it_works: string;
    trust_free: string;
    trust_no_card: string;
    trust_quick: string;
    how_title: string;
    how_subtitle: string;
    step1_title: string;
    step1_desc: string;
    step2_title: string;
    step2_desc: string;
    step3_title: string;
    step3_desc: string;
    features_title: string;
    features_subtitle: string;
    feature1_title: string;
    feature1_desc: string;
    feature2_title: string;
    feature2_desc: string;
    feature3_title: string;
    feature3_desc: string;
    feature4_title: string;
    feature4_desc: string;
    feature5_title: string;
    feature5_desc: string;
    feature6_title: string;
    feature6_desc: string;
    comparison_title: string;
    comparison_subtitle: string;
    traditional_title: string;
    traditional_1: string;
    traditional_2: string;
    traditional_3: string;
    traditional_4: string;
    traditional_5: string;
    traditional_6: string;
    ai_title: string;
    ai_1: string;
    ai_2: string;
    ai_3: string;
    ai_4: string;
    ai_5: string;
    ai_6: string;
    stats_title: string;
    stats_subtitle: string;
    stats_time: string;
    stats_time_desc: string;
    stats_saved: string;
    stats_saved_desc: string;
    stats_personalized: string;
    stats_personalized_desc: string;
    faq_title: string;
    faq_subtitle: string;
    faq1_q: string;
    faq1_a: string;
    faq2_q: string;
    faq2_a: string;
    faq3_q: string;
    faq3_a: string;
    faq4_q: string;
    faq4_a: string;
    faq5_q: string;
    faq5_a: string;
    faq6_q: string;
    faq6_a: string;
    final_cta_title: string;
    final_cta_subtitle: string;
    final_cta_features: string;
    final_cta_button: string;
    final_cta_login: string;
    final_cta_login_link: string;
  };
}

// Translation key paths (for type-safe t() function)
export type TranslationKey =
  | `common.${keyof Translations["common"]}`
  | `auth.${keyof Translations["auth"]}`
  | `trips.${keyof Translations["trips"]}`
  | `navigation.${keyof Translations["navigation"]}`
  | `errors.${keyof Translations["errors"]}`
  | `home.${keyof Translations["home"]}`;
