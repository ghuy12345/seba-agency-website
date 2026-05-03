<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Seba Agency website. This is a static Framer-exported marketing site. PostHog was integrated using the HTML snippet approach (no build system), with the init snippet injected into both `index.html` and `legal.html` via the existing `headStart` injection point. A new `js/analytics.js` file provides event-delegation-based tracking for all key user interactions across the site.

Autocapture is enabled by default, so all clicks, pageviews, and form interactions are tracked automatically. The custom events below capture higher-value, business-critical actions with enriched properties.

| Event | Description | File |
|-------|-------------|------|
| `cta_clicked` | User clicks a primary CTA button (e.g. "Book a call", "Get Started"). Includes `button_text`, `href`, and `section` properties. | `js/analytics.js` |
| `nav_link_clicked` | User clicks a navigation link in the header. Includes `label` (e.g. `about_us`, `our_services`, `case_study`) and `href`. | `js/analytics.js` |
| `social_link_clicked` | User clicks a social media icon (Instagram, LinkedIn, X/Twitter). Includes `platform` and `href`. | `js/analytics.js` |
| `faq_expanded` | User expands a FAQ question. Includes `question_text`. | `js/analytics.js` |
| `video_played` | User plays the embedded YouTube video. Includes `video_id` and `platform`. | `js/analytics.js` |
| `cta_section_viewed` | User scrolls to see the Call to Action section (top of conversion funnel, fires once per page load). Includes `section_id`. | `js/analytics.js` |

**Files modified:**
- `index.html` — PostHog init snippet + `<script defer src="js/analytics.js">` added in headStart
- `legal.html` — PostHog init snippet added in headStart
- `js/analytics.js` — New file with all custom event tracking
- `.env` — PostHog project token and host stored as `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://eu.posthog.com/project/171583/dashboard/657881
- **CTA Conversion Funnel** (cta_section_viewed → cta_clicked): https://eu.posthog.com/project/171583/insights/cQUw2eso
- **CTA Clicks Over Time:** https://eu.posthog.com/project/171583/insights/Cta2Ri5V
- **Social Link Clicks by Platform:** https://eu.posthog.com/project/171583/insights/BHf18ICx
- **FAQ Engagement:** https://eu.posthog.com/project/171583/insights/ryDy3VQH
- **Navigation Clicks by Destination:** https://eu.posthog.com/project/171583/insights/zfobMDfz

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
