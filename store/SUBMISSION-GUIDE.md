# NDV — Store Submission Guide (step by step)
Everything you must do, in order. Each phase lists time + cost. Check items off as you go.
Artifacts referenced live in this repo (paths relative to project root).

---

## PHASE 0 — Protect the keys (5 min, free, DO THIS FIRST)
Lose these and you can never update your own app again.
- [ ] Copy `android\app\ndv-upload.keystore` and `keystore.properties` to a safe place
      (password-manager attachment, USB stick, or encrypted cloud). They are NOT in git (on purpose).
- [ ] Optional: enable Play App Signing in Play Console later (Google keeps the master key;
      your upload key becomes replaceable). Recommended: yes.

## PHASE 1 — Privacy URL live (15 min, free)
Both stores REQUIRE a public privacy policy URL before submission.
1. - [ ] Edit `store/privacy.html` and `src/routes/privacy.tsx`: replace [EFFECTIVE DATE],
      [LEGAL ENTITY NAME], [privacy@your-domain.com].
2. - [ ] Host the static page (easiest = GitHub Pages, done after Phase 2 push):
     GitHub repo → Settings → Pages → Source: "Deploy from a branch" → Branch: main, folder: / (root) → Save.
     Your URL becomes: https://YOUR-USER.github.io/REPO/store/privacy.html
     (When you later deploy the real web app, switch the stores to https://your-domain.com/privacy —
      the /privacy route already exists in the app.)

## PHASE 2 — Push to GitHub (10 min, free; unlocks iOS builds)
1. - [ ] https://github.com/new → name e.g. `ndv-app` → **Private** → Create (no README/license — repo exists already).
2. - [ ] In a NEW terminal (git is on PATH now):
     cd C:\dev\ndv
     git remote add origin https://github.com/YOUR-USER/ndv-app.git
     git branch -M main
     git push -u origin main
     (Browser pops up to authenticate once.)
3. - [ ] Verify on github.com: you see memory-bank/, store/, android/, ios/.

## PHASE 3 — Google Play (≈2h work + review; $25 one-time)
Account:
1. - [ ] https://play.google.com/console → pay $25, verify identity (ID + sometimes a card).
       NOTE: new personal accounts must run a CLOSED TEST with 12 testers for 14 days
       before production access — start this ASAP.
Create the app:
2. - [ ] All apps → Create app → Name: `NDV · Luxury for Her` → Default language: English →
       App/Game: App → Free/Paid: Free → accept declarations.
3. - [ ] DECIDE appId NOW: current build = `au.com.ndvluxury`. If you want another, tell your agent
       BEFORE uploading (immutable after first upload).
Upload build:
4. - [ ] Left menu: Testing → Internal testing → Create new release →
       Upload `android\app\build\outputs\bundle\release\app-release.aab` →
       Release name: 1.0 → Notes: paste from store/play-listing.md "What\'s new".
Store listing (Main store listing):
5. - [ ] Short description + Full description: paste from `store/play-listing.md`.
6. - [ ] App icon: `store/assets/play-icon-512.png`. Feature graphic: `store/assets/play-feature-1024x500.png`.
7. - [ ] Phone screenshots: upload `store/assets/shot-1-home.png`, `shot-2-category.png`,
       `shot-3-product.png` (min 2). Tablet: optional.
8. - [ ] Category: Shopping. Contact email: yours. Privacy policy: URL from Phase 1.
Policy sections (left menu "Policy"):
9. - [ ] App content → Content rating questionnaire: category Shopping; answer No to violence/
       sexual content/gambling etc. (lingerie product photos are still fine at "Everyone"/"Teen" —
       answer truthfully: the questionnaire outputs the rating automatically).
10. - [ ] Data safety: copy answers from `store/play-listing.md` → Data safety section.
11. - [ ] Target audience: 18+. News app: No. Ads: No.
12. - [ ] If you made a personal account: Testing → Closed testing → add 12 tester emails,
      share the opt-in link, wait 14 days (Google requirement, cannot be skipped).
13. - [ ] Submit for review (internal track first; production after closed-test requirement met).

## PHASE 4 — Apple App Store (≈2h work + review; $99/yr) — no Mac needed
Account:
1. - [ ] https://developer.apple.com → enroll ($99/yr). Then https://appstoreconnect.apple.com.
Build the app (pick ONE):
  A. **Codemagic (recommended, free tier):**
   - [ ] https://codemagic.io → sign up with GitHub → add app → select the `ndv-app` repo.
   - [ ] It detects Capacitor. Build steps it needs (already committed to repo):
         npm ci → npm run build:app → npx cap sync ios → xcodebuild archive (scheme App,
         workspace ios/App/App.xcworkspace).
   - [ ] Enable "automatic code signing" with your App Store Connect API key (Codemagic wizard
         walks you through generating the key in App Store Connect → Users and Access → Keys).
   - [ ] Run build → it can upload the IPA straight to App Store Connect / TestFlight.
  B. **GitHub Actions (repo already has `.github/workflows/ios-build.yml`):**
   - [ ] Actions tab → iOS build → Run workflow → verifies compile (unsigned).
     For a signed IPA add the 4 secrets listed in the workflow header, then uncomment the
     signing block.
  C. **Any Mac:** open `ios/App/App.xcworkspace` in Xcode → Signing: Automatic (pick your team) →
     Product → Archive → Distribute to App Store Connect.
Listing (App Store Connect → Apps → + → New App):
2. - [ ] Platform iOS, Name `NDV · Luxury for Her`, Bundle ID: select `au.com.ndvluxury`
       (register it when prompted — must match), SKU: ndv-ios-1.
3. - [ ] Subtitle/Description/Keywords/Review notes: paste from `store/appstore-listing.md`.
4. - [ ] Screenshots: 6.9" + 6.5" required. Recapture on the iOS simulator/device (sizes in the
       listing file). Existing Android shots are the wrong aspect — do not reuse.
5. - [ ] Icon: already in the Xcode project (`assets/icon-only.png` → AppIcon).
6. - [ ] Privacy policy URL (Phase 1) + privacy nutrition labels (answers in the listing file).
7. - [ ] Age rating: Shopping, no restricted content. Pricing: Free.
8. - [ ] Attach build → Submit for review. Reply fast if Apple asks questions (usually about
       the WebView — the review note in appstore-listing.md preempts this).

## PHASE 5 — Clean the Shopify catalog (30–60 min, free) — do BEFORE public launch
Screenshots revealed AliExpress-import image problems (watermarks like "UU COSPLAY", "DFLOWER").
1. - [ ] https://admin.shopify.com/store/6g358e-tz → Products.
2. - [ ] For every product: open it → check images → remove/replace watermarked or wrong ones.
   (Your generated brand images are in `src/assets/` + `src/assets/products/` if you want to
    upload those as replacements.)
3. - [ ] While there: make prices/titles consistent (some descriptions still read like supplier text).

## PHASE 6 — Optional but recommended: test on your phone (10 min, free)
- Android: enable Developer options → USB debugging → plug in → then:
  "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" install C:\dev\ndv\android\app\build\outputs\apk\debug\app-debug.apk
- Or wirelessly: copy app-debug.apk to the phone and open it (allow unknown sources).

---
## After launch
- Tell your agent "resume NDV" → swap placeholder icons for final art, enable push notifications,
  wire Supabase OAuth deep links, point the Concierge at a hosted /api/chat, then bump
  versionCode/versionName in android/app/build.gradle and rebuild with `npm run app:sync` +
  `gradlew.bat bundleRelease`.
