# Hostaleria Joviat – Implementation review & fixes

## What was already implemented
- Home screen with hero section and buttons to explore restaurants/students
- Side menu with conditional items per login state (guest / user / admin)
- Login + Register (request access) flow
- Restaurant list: map mode (Leaflet) + list mode with pagination and search filter
- Manual clustering of nearby pins
- Custom popup card when clicking a pin
- Restaurant profile with map, workers list and admin edit/delete
- Alumni profile with work history and admin edit/delete
- User profile (edit own data)
- Restaurant request form (non-existing restaurant suggestion)
- Add Student form (with work experience blocks)
- Add Restaurant form (with Google Places autocomplete)
- Manage Altas (approve/reject user and restaurant requests)
- i18n for Catalan, Spanish and English

## What was missing / fixed

### [x] Step 1: Google Maps API key
- Created `.env` with `REACT_APP_GOOGLE_MAPS_API_KEY` so Google Places autocomplete works in AddRestaurant.

### [x] Step 2: Logout confirmation dialog
- Modified `App.js` logout handler to call `window.confirm(t('logoutConfirm'))` before signing out.
- Added `logoutConfirm` key to all three language objects in `i18n.js`.

### [x] Step 3: Header user indicator
- For admin: show email (no avatar).
- For normal user: show avatar image (if `userRecord.photoURL` is set) + name/email.
- Updated `.user-indicator` CSS to use flex layout and added `.user-avatar` style.

### [x] Step 4: Alumni contact info gating
- Added `isLoggedIn` prop to `AlumniProfile` component.
- Contact grid (email, phone, LinkedIn) is only rendered when `isLoggedIn` is true.
- When not logged in a notice message is shown instead (uses `loginToSeeContact` i18n key).
- Added `loginToSeeContact` key to all three languages.

### [x] Step 5: Custom Joviat map pins
- Replaced standard Leaflet `L.icon` with an `L.divIcon` that renders the Joviat logo inside a teardrop-shaped pin.
- Added `.joviat-pin-wrapper`, `.joviat-pin`, `.joviat-pin img` CSS rules.
- Added `.contact-hidden-notice` CSS for the login-required notice in alumni profile.
