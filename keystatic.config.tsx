import { config, collection, fields, singleton } from '@keystatic/core';

/**
 * Atlas Jiu-Jitsu CMS.
 *
 * Everything an owner edits lives here: schedule, classes, announcements,
 * news, FAQ, testimonials, instructors and site-wide contact details.
 * Content is saved as YAML/Markdown files in src/content/, committed to
 * GitHub, and the site rebuilds automatically.
 *
 * Storage mode (see README → "Editing the site"):
 *   PUBLIC_KEYSTATIC_CLOUD_PROJECT set   → Keystatic Cloud (easiest login)
 *   PUBLIC_KEYSTATIC_GITHUB_APP_SLUG set → GitHub App login
 *   neither                              → local files (for `npm run dev`)
 */
const cloudProject = import.meta.env.PUBLIC_KEYSTATIC_CLOUD_PROJECT;
const githubApp = import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG;

const DAYS = [
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
  { label: 'Sunday', value: 'sun' },
] as const;

const PROGRAMS = [
  { label: 'No-Gi Jiu-Jitsu', value: 'nogi' },
  { label: 'Wrestling', value: 'wrestling' },
  { label: 'Open Mat', value: 'openmat' },
  { label: 'Fundamentals', value: 'fundamentals' },
  { label: 'Competition', value: 'competition' },
  { label: 'Kids', value: 'kids' },
] as const;

const time = (label: string) =>
  fields.text({
    label,
    description: '24-hour time, e.g. 06:00 or 18:30',
    validation: {
      pattern: { regex: /^([01]\d|2[0-3]):[0-5]\d$/, message: 'Use HH:MM, 24-hour (e.g. 18:30)' },
    },
  });

const photo = (label: string, dir: string, description?: string) =>
  fields.image({
    label,
    description,
    directory: `src/assets/images/${dir}`,
    publicPath: `/src/assets/images/${dir}/`,
  });

export default config({
  storage: cloudProject
    ? { kind: 'cloud' }
    : githubApp
      ? { kind: 'github', repo: { owner: 'BakerSixCo', name: 'Atlas' } }
      : { kind: 'local' },
  ...(cloudProject ? { cloud: { project: cloudProject } } : {}),

  ui: {
    brand: { name: 'Atlas Jiu-Jitsu' },
    navigation: {
      Schedule: ['classes', 'schedule'],
      'News & Alerts': ['posts', 'settings'],
      Pages: ['programs', 'home', 'about', 'handbook'],
      People: ['instructors', 'testimonials', 'faq'],
    },
  },

  collections: {
    programs: collection({
      label: 'Program pages',
      slugField: 'title',
      path: 'src/content/programs/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({
          name: { label: 'Program name', description: 'e.g. "No-Gi Jiu-Jitsu"' },
          slug: { label: 'Page URL', description: 'Lowercase words with dashes. Changing it breaks old links.' },
        }),
        order: fields.integer({ label: 'Sort order', defaultValue: 10 }),
        program: fields.select({
          label: 'Schedule program',
          description: 'Classes with this program are listed on the page automatically.',
          options: [{ label: 'None (no class list)', value: 'none' }, ...PROGRAMS],
          defaultValue: 'none',
        }),
        seoTitle: fields.text({
          label: 'Google title',
          description: 'Shown in Google results and browser tabs. ~50–60 characters. Put the main search phrase first.',
          validation: { length: { max: 70 } },
        }),
        seoDescription: fields.text({
          label: 'Google description',
          description: 'The 1–2 sentence snippet under the title in Google. ~140–160 characters.',
          multiline: true,
          validation: { length: { max: 180 } },
        }),
        kicker: fields.text({ label: 'Small heading above title' }),
        heading: fields.text({ label: 'Page headline (H1)' }),
        intro: fields.text({ label: 'Intro paragraph', multiline: true }),
        cardText: fields.text({ label: 'Card text', description: 'Short blurb shown on the Programs page and home page.', multiline: true }),
        heroImage: photo('Hero photo', 'photos'),
        heroImageAlt: fields.text({ label: 'Hero photo description' }),
        highlights: fields.array(
          fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }),
          { label: 'Highlights', itemLabel: (p) => p.fields.title.value },
        ),
        faq: fields.array(
          fields.object({ question: fields.text({ label: 'Question' }), answer: fields.text({ label: 'Answer', multiline: true }) }),
          { label: 'Questions for this page', description: 'These can appear as expandable answers in Google.', itemLabel: (p) => p.fields.question.value },
        ),
        body: fields.markdoc({ label: 'Page content', extension: 'md' }),
      },
    }),

    classes: collection({
      label: 'Classes',
      slugField: 'title',
      path: 'src/content/classes/*',
      format: { data: 'yaml' },
      columns: ['title', 'start'],
      schema: {
        title: fields.slug({ name: { label: 'Class name', description: 'e.g. "All Levels No-Gi" or "Wrestling"' } }),
        program: fields.select({ label: 'Program', options: [...PROGRAMS], defaultValue: 'nogi' }),
        days: fields.multiselect({ label: 'Days', options: [...DAYS], defaultValue: [] }),
        start: time('Start time'),
        end: time('End time'),
        level: fields.select({
          label: 'Level',
          options: [
            { label: 'All levels', value: 'all' },
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate / Advanced', value: 'advanced' },
          ],
          defaultValue: 'all',
        }),
        instructor: fields.text({ label: 'Instructor (optional)' }),
        description: fields.text({ label: 'Short description', multiline: true }),
        active: fields.checkbox({
          label: 'Show on schedule',
          description: 'Uncheck to hide a class without deleting it.',
          defaultValue: true,
        }),
      },
    }),

    posts: collection({
      label: 'News & Events',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        summary: fields.text({ label: 'Summary', description: 'One or two sentences. Shown on cards and in Google.', multiline: true }),
        cover: photo('Cover photo', 'posts'),
        coverAlt: fields.text({ label: 'Cover photo description', description: 'Describe the photo for screen readers and Google.' }),
        draft: fields.checkbox({ label: 'Draft (hidden from the site)', defaultValue: false }),
        event: fields.conditional(
          fields.checkbox({ label: 'This post is an event (seminar, open mat, tournament…)', defaultValue: false }),
          {
            true: fields.object({
              start: fields.datetime({ label: 'Starts', validation: { isRequired: true } }),
              end: fields.datetime({ label: 'Ends' }),
              location: fields.text({ label: 'Location (leave blank for Atlas)' }),
              registerUrl: fields.url({ label: 'Registration link (optional)' }),
              price: fields.text({ label: 'Price (optional)', description: 'e.g. "Free", "$40"' }),
            }),
            false: fields.empty(),
          },
        ),
        body: fields.markdoc({
          label: 'Body',
          extension: 'md',
          options: { image: { directory: 'public/images/posts', publicPath: '/images/posts/' } },
        }),
      },
    }),

    instructors: collection({
      label: 'Instructors',
      slugField: 'name',
      path: 'src/content/instructors/*',
      format: { contentField: 'bio' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role', defaultValue: 'Instructor' }),
        rank: fields.text({ label: 'Rank', description: 'e.g. Black belt' }),
        order: fields.integer({ label: 'Sort order', description: 'Lower numbers show first.', defaultValue: 10 }),
        photo: photo('Photo', 'instructors', 'A cut-out on a transparent or black background looks best.'),
        lineage: fields.text({ label: 'Lineage (optional)', multiline: true }),
        bio: fields.markdoc({ label: 'Bio', extension: 'md' }),
      },
    }),
  },

  singletons: {
    settings: singleton({
      label: 'Site settings & alert banner',
      path: 'src/content/settings',
      format: { data: 'yaml' },
      schema: {
        banner: fields.object(
          {
            enabled: fields.checkbox({ label: 'Show banner', defaultValue: false }),
            text: fields.text({ label: 'Banner text', description: 'e.g. "Closed Thanksgiving Day. Open mat Friday 10am."' }),
            link: fields.text({ label: 'Banner link (optional)', description: 'e.g. /schedule or a full URL' }),
          },
          { label: 'Alert banner (top of every page)' },
        ),
        phone: fields.text({ label: 'Phone', validation: { isRequired: true } }),
        email: fields.text({ label: 'Email', validation: { isRequired: true } }),
        addressLine1: fields.text({ label: 'Street address' }),
        addressLine2: fields.text({ label: 'City, state ZIP' }),
        locationNote: fields.text({ label: 'Location note', description: 'e.g. "Inside The Mecca Gym"' }),
        mapsUrl: fields.url({ label: 'Google Maps link' }),
        signupUrl: fields.url({ label: 'Sign-up / membership link' }),
        signupLabel: fields.text({ label: 'Sign-up button text', defaultValue: 'Sign up' }),
        instagram: fields.url({ label: 'Instagram URL' }),
        facebook: fields.url({ label: 'Facebook URL (optional)' }),
        youtube: fields.url({ label: 'YouTube URL (optional)' }),
        googleBusinessUrl: fields.url({
          label: 'Google Business Profile link',
          description: 'Your listing\'s "Share" link from Google Maps. Strengthens local search.',
        }),
        reviewUrl: fields.url({ label: 'Google review link', description: 'From Google Business Profile → "Ask for reviews".' }),
        latitude: fields.text({ label: 'Latitude', description: 'Right-click the gym in Google Maps → copy the first number.' }),
        longitude: fields.text({ label: 'Longitude', description: 'The second number from the same right-click.' }),
        areaServed: fields.array(fields.text({ label: 'City' }), {
          label: 'Areas served',
          description: 'Nearby cities you draw students from.',
          itemLabel: (p) => p.value,
        }),
        hostGymName: fields.text({ label: 'Host gym name' }),
        hostGymUrl: fields.url({ label: 'Host gym website' }),
      },
    }),

    schedule: singleton({
      label: 'Schedule notes & closures',
      path: 'src/content/schedule',
      format: { data: 'yaml' },
      schema: {
        intro: fields.text({ label: 'Intro text above the schedule', multiline: true }),
        closures: fields.array(
          fields.object({
            date: fields.date({ label: 'Date', validation: { isRequired: true } }),
            endDate: fields.date({ label: 'End date (for multi-day closures)' }),
            note: fields.text({ label: 'Note', description: 'e.g. "Closed: Thanksgiving"' }),
          }),
          {
            label: 'Closures & holiday hours',
            description: 'Past dates hide automatically.',
            itemLabel: (p) => `${p.fields.date.value ?? '?'}: ${p.fields.note.value}`,
          },
        ),
      },
    }),

    home: singleton({
      label: 'Home page',
      path: 'src/content/home',
      format: { data: 'yaml' },
      schema: {
        heroKicker: fields.text({ label: 'Hero small text', defaultValue: 'Meridian, Idaho · No-Gi Brazilian Jiu-Jitsu' }),
        heroTitle: fields.text({ label: 'Hero headline' }),
        heroSubtitle: fields.text({ label: 'Hero sub-headline', multiline: true }),
        heroImage: photo('Hero photo', 'photos'),
        heroImageAlt: fields.text({ label: 'Hero photo description' }),
        pillars: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            body: fields.text({ label: 'Text', multiline: true }),
          }),
          { label: 'What makes us different', itemLabel: (p) => p.fields.title.value },
        ),
        gallery: fields.array(
          fields.object({
            image: photo('Photo', 'photos'),
            alt: fields.text({ label: 'Photo description' }),
          }),
          { label: 'Photo strip', itemLabel: (p) => p.fields.alt.value || 'Photo' },
        ),
        videoTitle: fields.text({ label: 'Video section title' }),
        videoBody: fields.text({ label: 'Video section text', multiline: true }),
      },
    }),

    about: singleton({
      label: 'About page',
      path: 'src/content/about',
      format: { data: 'yaml' },
      schema: {
        storyTitle: fields.text({ label: 'Story title' }),
        story: fields.text({ label: 'Our story', multiline: true, description: 'Blank line = new paragraph.' }),
        valuesIntro: fields.text({ label: 'Values intro', multiline: true }),
        values: fields.array(
          fields.object({
            title: fields.text({ label: 'Value' }),
            body: fields.text({ label: 'Explanation', multiline: true }),
          }),
          { label: 'Values', itemLabel: (p) => p.fields.title.value },
        ),
        gymIntro: fields.text({ label: 'Host gym intro', multiline: true }),
        gymPerks: fields.array(
          fields.object({
            title: fields.text({ label: 'Perk' }),
            body: fields.text({ label: 'Text' }),
          }),
          { label: 'Host gym perks', itemLabel: (p) => p.fields.title.value },
        ),
        gymPhoto: photo('Host gym photo', 'gym'),
      },
    }),

    handbook: singleton({
      label: 'Student handbook',
      path: 'src/content/handbook',
      format: { contentField: 'body' },
      entryLayout: 'content',
      schema: {
        intro: fields.text({ label: 'Intro', multiline: true }),
        pdf: fields.file({
          label: 'Handbook PDF (optional download)',
          directory: 'public/files',
          publicPath: '/files/',
        }),
        body: fields.markdoc({ label: 'Handbook', extension: 'md' }),
      },
    }),

    faq: singleton({
      label: 'FAQ',
      path: 'src/content/faq',
      format: { data: 'yaml' },
      schema: {
        items: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
            onHome: fields.checkbox({ label: 'Show on home page', defaultValue: true }),
          }),
          { label: 'Questions', itemLabel: (p) => p.fields.question.value },
        ),
      },
    }),

    testimonials: singleton({
      label: 'Testimonials',
      path: 'src/content/testimonials',
      format: { data: 'yaml' },
      schema: {
        items: fields.array(
          fields.object({
            name: fields.text({ label: 'Name' }),
            detail: fields.text({ label: 'Detail', description: 'e.g. "Member since 2024" or "Parent & student"' }),
            quote: fields.text({ label: 'Quote', multiline: true }),
          }),
          { label: 'Testimonials', itemLabel: (p) => p.fields.name.value },
        ),
      },
    }),
  },
});
