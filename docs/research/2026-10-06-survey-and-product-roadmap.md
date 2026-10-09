# Lexycon survey analysis and implementation roadmap

**Analysis date:** 6 October 2026, Africa/Lagos. **Decision:** improve the existing study-and-return journey before expanding paid features. This is analysis and planning; no product changes were implemented.

## 1. Evidence and counting rules

**Survey source:** `Untitled form.csv.zip`, containing only `Untitled form.csv` (18,751 uncompressed bytes). Archive SHA-256: `31B8529CD422ECA790EDE07D73EF10577060F7603F79A69F2DF4D66FF6F368B2`. The exact CSV member was read into memory, without extracting personal data into repository files. Verified **23 response records**, 20 columns, and no malformed-width records. Timestamps run from 5 October 2026, 22:27:16 to 6 October 2026, 13:38:43, GMT+1.

**Implementation source:** the `dashboard-restoration` checkout, commit `9d24206` (Add daily recall progress streak), inspected on the analysis date. The neighbouring `Lexicon` checkout is older (`f2809dc`) and is not the basis of feature recommendations. Read the project instructions, brief, contribution guidance, design guidance, backend, dashboard, onboarding, pricing, and relevant tests. README and DEPLOYMENT descriptions conflict with newer code; code takes precedence for implementation status. Deployment configuration and live service behaviour were not verified.

**Method:** one CSV record is one response, not a verified unique person. Counts use all 23 records unless a different denominator is stated. Percentages are count ÷ denominator, rounded to one decimal. Checkbox fields Q4, Q6 and Q11 were split on semicolons, trimmed, and deduplicated within each response. Multiple selections and overlapping qualitative themes can exceed 100%. Written answers were manually coded for explicit content; interpretations are labelled. No respondent names, contacts, or sensitive personal narratives are reproduced.

### Data quality

- No exact duplicate rows, repeated timestamps, duplicate complete answer profiles excluding timestamps/contacts, or repeated nonblank contacts after trimming/case normalization were found. This cannot rule out one person responding differently twice or using different contact formats. No records were removed.
- Q4 says “Choose up to two”: **8/23 (34.8%)** selected 3–4 materials. Q6 asks for two problems: **8/23 (34.8%)** selected 3–7. Retain every selection as a mention, not a valid forced ranking. A sensitivity check below uses only responses within the limit.
- Q11 asks for three valued parts: nobody exceeded three; **5/23 (21.7%)** selected only one. The other 18 selected three. Do not fabricate the missing preferences or treat unselected options as disliked.
- All principal closed questions are answered. Blank fields: abandonment detail 4/23 (17.4%); payment detail 11/23 (47.8%); cancellation reason 9/23 (39.1%); renewal expectation 5/23 (21.7%); contact 1/23 (4.3%). Literal “null”, “N/A”, punctuation, and vague answers are nonblank but not substantive evidence.
- All 11 self-reported app abandoners supplied a nonblank detail, but several give only a tool name or no explanation. Eight other respondents supplied abandonment text despite not selecting “Yes”; these are not counted as confirmed abandonment reasons.
- Only **3 respondents** said they paid within the **past one year and stopped**. All three supplied payment details and cancellation reasons. **11 ineligible respondents** also answered the cancellation question; their reasons are excluded from cancellation statistics. One respondent selected “No” to payment but named ChatGPT and “7k” in the follow-up. Retain the contradiction and the primary answer, rather than silently reclassifying them as a payer.
- Beta interest: 22 “Yes”, but only **21/22 (95.5%)** have a nonblank contact. The “No” respondent also supplied a contact. That contact does not override their refusal. Deliverability and participation consent still need confirmation outside this report.

This is a small, self-selected sample with unknown recruitment channel, institution mix, discipline mix, year of study, invitation denominator and response rate. It does not represent Nigerian students generally. One answer changes a full-sample percentage by 4.3 points. The useful evidence is the recurring problems and concrete failure stories, not a market-size or revenue estimate. The CSV does not preserve the full form introduction or all branching configuration, so the concept description seen by respondents cannot be reconstructed completely.

## 2. What students reported

### Current behaviour

All percentages in this subsection use **n=23**.

- **Courses this semester:** 3–5: 7 (30.4%); 6–8: 11 (47.8%); 9+: 5 (21.7%). Thus 16/23 (69.6%) take at least six courses. These are semester course counts, not monthly package creation counts.
- **Normal weekly study outside lectures:** zero days: 5 (21.7%); 1–2 days: 9 (39.1%); 3–4 days: 5 (21.7%); 5–7 days: 4 (17.4%). **14/23 (60.9%) normally study at most two days a week.** The question is not about examination-week frequency.
- **Start of serious preparation:** a few days before: 7 (30.4%); one or two weeks before: 4 (17.4%); about a month before: 2 (8.7%); throughout the semester: 5 (21.7%); varies by course: 5 (21.7%). Eleven (47.8%) usually start within two weeks. “Throughout” does not necessarily mean daily study.
- **Materials used most this semester:** lecture slides/PDFs: 20 (87.0%); own notes: 12 (52.2%); past questions: 9 (39.1%); textbooks: 3 (13.0%); videos/recordings: 3 (13.0%); “Ai”: 1 (4.3%). Keep the free-text “Ai” option separate from source materials. Among the **15 within-limit responses**, slides/PDFs remain dominant: 12/15 (80.0%), own notes 5/15 (33.3%), past questions 2/15 (13.3%), “Ai” 1/15 (6.7%).
- **Most recent study session:** 18/23 (78.3%) explicitly mention AI, ChatGPT (including spelling variants), Gemini, or DeepSeek. This is a manually coded mention count, not proof of frequent use. Six answers merely name ChatGPT without explaining its purpose. Other answers describe reading slides, rewriting summaries, generating questions, practicing past questions, videos, or friends. One describes summarizing with AI, rewriting in their own words, then using the lecture as a reference. Lexycon should fit that existing verification workflow.

### Reported problems last semester

Checkbox mentions, **n=23**:

| Problem | Count / respondents | Percentage |
|---|---:|---:|
| Remembering studied material | 15/23 | 65.2% |
| Turning long materials into manageable notes | 14/23 | 60.9% |
| Understanding difficult concepts | 11/23 | 47.8% |
| Finding time or staying consistent | 10/23 | 43.5% |
| Deciding what to study next | 5/23 | 21.7% |
| Trusting AI answer accuracy | 5/23 | 21.7% |
| Questions covering the material properly | 3/23 | 13.0% |
| Knowing weak topics | 3/23 | 13.0% |

**Sensitivity check:** among the 15 selecting exactly two problems, remembering and manageable notes tie at 7/15 (46.7%) each; understanding is 6/15 (40.0%); consistency 4/15 (26.7%); deciding next and accuracy 2/15 (13.3%) each; question coverage and weak topics 1/15 (6.7%) each. The leading needs survive removal of over-limit selections; the exact ordering between memory and notes does not.

**Recent difficulty narratives:** 14/23 (60.9%) describe a usable mechanism; 9/23 (39.1%) are vague, nonspecific, or non-answers. Overlapping explicit themes, denominator all 23: excessive/incomplete material or summaries 5/23 (21.7%); difficulty understanding 4/23 (17.4%); focus/fatigue barriers 4/23 (17.4%); recall difficulty 2/23 (8.7%); back-to-back examinations 1/23 (4.3%). These are exploratory coding decisions, not independently validated categories. Do not interpret focus difficulties as a diagnosis or a request for medical intervention.

Short anonymous excerpts illustrate the mechanisms: “the notes didn’t cover enough and I had to make them again”; “spent way too much time trying”; “I used flash cards but didn’t remember anything”. The last statement does not establish that flashcards are ineffective; it supports observing whether users actually retrieve an answer before revealing it and return later.

### Feature preferences and anticipated concerns

**Q11 valued parts, n=23:** practice covering different parts of material 15/23 (65.2%); clear lecture notes 11/23 (47.8%); explanations and source references 9/23 (39.1%); progress showing remembered/weak material 9/23 (39.1%); flashcards 8/23 (34.8%); a daily session choosing reviews 6/23 (26.1%); streaks/milestones 1/23 (4.3%). Explanations and references are one bundled answer: their individual popularity cannot be separated.

**Q12 biggest concern, n=23:** missing important topics 6/23 (26.1%); incorrect/misleading content 6/23 (26.1%); repetitive/boring sessions 6/23 (26.1%); subscription cost 3/23 (13.0%); setup/upload effort 2/23 (8.7%). Because this is a single-choice question, the 12/23 (52.2%) choosing accuracy or coverage are distinct respondents. These are anticipated concerns, not observed Lexycon failures.

**Q10 expected usefulness, n=23:** throughout the semester 16/23 (69.6%); last few days before assessments 3/23 (13.0%); weeks before assessments 2/23 (8.7%); only particularly difficult courses 2/23 (8.7%). This is aspiration, not demonstrated retention.

**Implication:** scheduled recall is a reasonable hypothesis because memory and consistency are common problems. It is not validated as a daily habit: only 6/23 specifically prioritise daily selection and only 4/23 study 5–7 days normally. Offer short daily opportunities while testing an optional weekly goal, such as two or three chosen study days. Avoid treating a missed day as failure. No weekly-goal question was asked, so this is an additional product hypothesis.

Accuracy and coverage warrant high priority despite fewer historical problem mentions: an incorrect answer can teach a false fact, and an omitted topic can create false examination confidence. Concise notes, useful explanations and varied practice directly address observed needs. Variety should mean useful topic/concept variation and existing question formats, not decorative games or generating every review again.

### Abandonment and actual past payments

**Stopped a study app:** Yes 11/23 (47.8%); No 4/23 (17.4%); never tried one 8/23 (34.8%). Among the 15 indicating they have tried one, 11/15 (73.3%) report stopping at least one. This is neither an app churn rate nor a time-bounded retention measure.

Within the **11 eligible abandoners**, six provide an interpretable app-related reason. Overlapping themes: inefficiency 2/11 (18.2%); expense 2/11 (18.2%); preference for another method/tool 2/11 (18.2%); slow larger-document processing 1/11 (9.1%); desire for shorter notes 1/11 (9.1%); poor usability 1/11 (9.1%). The other five include two names without reasons, two vague responses, and one description of bulky lecturer PDFs rather than an app. Do not force these into a causal category. One ineligible follow-up cites inaccuracy and another says a course ended; retain these only as unconfirmed anecdotes, not confirmed abandonment statistics.

**Payments in the past year:** No 20/23 (87.0%); paid but stopped 3/23 (13.0%); no respondent reported continuing payment. Eligible payment details name Turbo without an amount, ExamCrush at approximately ₦1,500/month, and Exam Crush at ₦2,000 without a period. Do not calculate average monthly spend from these incomplete amounts or include the contradictory “7k” response as verified spend.

**Cancellation reasons, eligible n=3 only:** too expensive 1/3 (33.3%); inaccurate/not useful enough 1/3 (33.3%); mainly needed during exams 1/3 (33.3%). This is three individual experiences. Counting all follow-up answers would incorrectly inflate the evidence for seasonal cancellation and price sensitivity.

### Renewal expectations and beta interest

Q14 has **18/23 (78.3%) nonblank answers**, including three vague/non-substantive replies. The following manually coded themes overlap; denominators are all 23 and the 18 nonblank replies:

- Results, exam readiness, understanding or grade expectations: 6/23 (26.1%), 6/18 (33.3%). Grade demands are aspirations, not outcomes Lexycon should promise.
- Accuracy or proper summaries: 3/23 (13.0%), 3/18 (16.7%).
- Memory support, engagement or meaningful variety: 3/23 (13.0%), 3/18 (16.7%).
- Ease, efficiency or responsive product improvement: 3/23 (13.0%), 3/18 (16.7%).
- Affordability, trial/comparison with studying alone, and paying only when needed: one each, 1/23 (4.3%) or 1/18 (5.6%).

For example, “I have to try it to see if it’s better than just studying on my own” asks for demonstrated value, while “I will pay when I need it and not when I don’t” challenges automatic year-round renewal. These are all respondents’ expectations, not only previous payers’ explanations for paying again. Show useful, accurate work on their own lecture and an understandable correction to a mistake before asking for payment.

**Beta interest:** Yes 22/23 (95.7%); No 1/23 (4.3%). There are 21 contactable “Yes” records, subject to contact verification. Interest is a recruitment pool, not activation, adoption or retention. No invitations or messages were sent during this analysis.

## 3. Pricing and packages

The actual question assumes accurate content and an app that works well. Responses: try first 9/23 (39.1%); Student, ₦3,000 for five new course packages/month 6/23 (26.1%); Pro, ₦7,000 for ten 4/23 (17.4%); Free, one new package/month 4/23 (17.4%). The combined 10/23 (43.5%) choosing a paid option is **hypothetical preference**, not payment conversion. Price and capacity changed together, so their individual effects cannot be isolated.

| Semester courses | Free | Student | Pro | Try first | Group total |
|---|---:|---:|---:|---:|---:|
| 3–5 | 0/7 | 2/7 | 3/7 | 2/7 | 7 |
| 6–8 | 3/11 | 2/11 | 1/11 | 5/11 | 11 |
| 9+ | 1/5 | 2/5 | 0/5 | 2/5 | 5 |

Three of the four Pro selectors have only 3–5 courses; no 9+ respondent selected Pro. This does not support a simple “more courses causes upgrades” claim. With only four Pro choices it also does not prove capacity is irrelevant.

Course grouping is sensible and already exists, but these data do not establish a monthly allowance. A student might create all semester courses once, add many lecture files to each, and review old questions for months. Clarify: what is a package, what counts as new, whether adding a lecture consumes allowance, what happens to old packages after downgrade, and whether unused allowance rolls over. A hard course cap could obstruct studying without creating willingness to pay.

**Current contradictions to resolve in product copy:** backend permits one course total, not one new package per month; landing pricing advertises 3/30/75 learning packs; the brief lists 3/30/100; this survey tests 1/5/10 course packages. Subscriptions are explicitly not open in the landing UI and there is no inspected billing/entitlement implementation. None of these alternatives is validated by this sample. Keep prices provisional; do not implement anti-combination PDF rules to enforce an unproven unit of value.

Still untested: actual purchase at either price; renewal beyond examinations; incremental value over existing AI tools; cost per useful study session; generation/retry volume; storage and review costs; monthly package demand; willingness to pay for capacity separately from features; affordability outside this recruitment group. Track usage and ask why a second course matters before constraining it.

## 4. What the current app actually does

**Status vocabulary:** “working in tests” means executable behaviour supported by the local checks, not confirmed production operation. “Partial” means an implemented path has a known gap. “Missing” means no connected implementation was found. “Not verifiable” covers live deployment, AI quality, latency and retention.

The actual stack is FastAPI/Python, React/Vite dashboard, Next.js landing/onboarding, Firebase identity, hosted Firestore, and local SQLite. PostgreSQL is a preference in the brief, not the current storage engine. There is no reason to migrate databases merely for this beta.

| Journey / capability | Status and evidence | Consequence |
|---|---|---|
| Sign in and ownership | Partial; Firebase AuthGate and bearer-token API calls exist. `app/auth.py:20` requires verification only when `LEXICON_REQUIRE_AUTH=true`; otherwise every request receives `local-development`. Hosted Firestore reads check `owner_id`. Local SQLite is not account-isolated. Auth unit tests mock verification. | Verify deployed configuration and two-account isolation before inviting private uploads. Do not recommend building authentication again. A login screen alone does not secure an API. |
| Course setup | Working in local tests; `app/main.py:232`, `app/materials.py:160`, `app/cloud_store.py:26`; onboarding calls course creation. | One total course is enforced. Multiple course packages, monthly resets and paid upgrades are missing. Do not label the existing course feature missing. |
| Upload and library | Working in tested local flows; `app/main.py:138,208`, `app/document_text.py:17`. PDF/DOCX/PPTX/TXT and 25 MB boundary. Hosted save requires a course and rejects >60,000 readable characters. | The file-size limit does not mean a long lecture is supported. Hosted read errors/limits require a real-file check. Original uploads are not stored by this backend; extracted text is. |
| Notes | Generation schema and chunk combination tested; `app/study_packs.py:28,67`; dashboard renders notes. | Notes are browser state only. Two-to-six output sections constrain detail. No page references, source verification, saved notes endpoint or coverage audit. |
| Flashcards and recall storage | Existing; generation from saved material persists cards immediately due, `app/main.py:381`, storage `save_flashcards`. Review routes are tested locally. | Cards can return without regeneration. Generation creates new UUIDs every time, so recreating a set can duplicate concepts and reset their learning history. |
| First flashcard study | Partial; `StudyResources.jsx:8` stores “Got it”/“Review again” only inside the component. `TodayRecall.jsx` uses the actual review API. | A student can rate cards in the study tab without scheduling anything. Two similar controls have different effects. Guide first recall through the saved-card path. |
| Scheduling and streak | Existing; `materials.py:228` and `cloud_store.py:135`: Again=1 day, Hard=3, Got it=7 then 14/28/30 maximum. Review events feed a streak. | Improve this scheduler rather than add another. UI always says “7 days” for Got it even when next interval is longer. UTC dates define progress; streak is zero before the first review today. No weekly goals or measured mastery. |
| Recall availability | Partial; `hosted_access.py:5`, `cloud_store.py:125`, `App.jsx:48,81,136`. | Every rating is classified as generation and can exhaust the shared 30/day allowance. Hosted due query takes 100 cards before filtering due cards; due cards beyond the first 100 may be hidden. The response is capped at 50 and the UI removes cards without fetching the next batch. “Caught up” can therefore be misleading. |
| Recall progress | Partial; `cloud_store.py:154` fetches an unordered maximum 500 review events twice. | Older/high-volume histories can undercount recent activity. Events store time/card, not rating, session or prior interval. Retries can count twice and advance spacing twice. Current metrics cannot calculate recall-session completion reliably. |
| Mixed practice and mistake review | Existing; `practice.py:26,63`, `Practice.jsx:15`. Five MCQs, three gaps, two theory prompts; correct MCQ answers/explanations and expected gap words now display after submission. | Improve existing feedback. Gap grading is exact text after case/space normalization; valid synonyms can be marked wrong. Theory marking guidance exists in generated data but is not shown by the component. |
| Practice history / reuse | Partial; Firestore saves the generated mixed-practice set, but without material ID or a discovery route. Dashboard keeps its ID, answers and results only in memory. | Refresh loses the user’s path back to it. Separate saved MCQ quizzes and attempt history already exist (`main.py:440` onward, `quizzes.py`) but dashboard does not use them. MCQs are not scheduled in Today’s Recall. |
| Assessment integrity | Partial; saved MCQ route removes answers before attempts; mixed `practice-session` returns the full PracticeSet including keys. | Answers are visually hidden but present in the network response. Reuse the existing student-safe response pattern; do not interpret scores as strong learning evidence. |
| Progress / weak topics | Partial; current-visit mixed-practice scores appear in My progress. Saved quiz scoring produces per-topic results. | No connected longitudinal weak-topic view. A score on a few items is performance on those items, not proof of topic mastery. |
| Onboarding, loading and recovery | Partial; real course creation plus locally stored profile/goals/minutes in `landing/app/onboarding/onboarding.tsx`. Dashboard initially loads four endpoints with one `Promise.all`; Retry reloads only materials. | A recall failure can prevent course/library initialization. Retry cannot restore the whole state. Onboarding minutes do not control recall sessions. The profile storage key is not account-specific. |
| Source reader and browser library | Older components/files remain, but the active dashboard does not import `DocumentReader` or `browser-library`. | Their presence does not prove the current cloud study flow has a source viewer or offline library. |
| Payments, package policing, RAG | Missing from connected implementation. Landing pricing/sample visuals are not entitlements, checkout, source retrieval or paid streaks. | Postpone major investment pending actual use. The simple existing streak is not paid and does not need a rewrite. |

### Document coverage and educational quality

The active extractor visits every PDF page and joins extracted strings. It does not silently truncate to the first 60,000 characters. However, it drops page boundaries, cannot read images/diagrams, and only rejects the document when **all** extracted text is empty. A mixed text/scanned PDF can succeed while omitting unreadable pages. Garbled but nonempty extraction can also pass. Therefore “all pages visited” is not “all teaching content understood”.

`text_chunks.py` permits up to four 60,000-character chunks for notes/flashcards/MCQs, then rejects excess. Notes summarize each chunk and combine summaries; flashcards select five cards per chunk for multi-chunk sources; MCQs create five questions per chunk. These are size-based rules, not topic-based allocation. Hosted saved uploads cap at 60,000 characters, and mixed practice supports one chunk only. Hidden direct generation endpoints and local storage can exercise different limits; communicate the active user path’s limit.

Topics on questions are model-generated labels, not a verified document map. There are no persisted page/slide locations, topic inventory, learning-objective allocation, coverage comparison, or semantic duplicate checks. Flashcard instructions ask to avoid duplicates; validators do not enforce concept uniqueness. MCQ validation checks four distinct labelled options and one marked key; it cannot establish one defensible answer, source truth or plausible distractors. Those require content review.

MCQ explanations exist and display; correctness and usefulness are not verified by their nonempty string constraint. Gap feedback lacks explanatory source support, and theory guidance is not surfaced. Labels such as “Complete material flashcards” and “Complete material quiz questions” overstate what fixed-size samples demonstrate. Even one question per topic would establish only sampled topic representation, not every detail, level of difficulty or exam objective.

### Verification performed

- **42 backend tests passed**, with generation mocked and synthetic/local test databases. Initial sandbox runs had two temporary-directory permission errors; rerunning with permitted temporary access passed. No product fixes were made.
- **Frontend production build passed**, emitted to a disposable analysis directory. Its first sandbox attempt could not spawn a build helper; the permitted rerun passed. No deployment occurred.
- Independent Python CSV parsing reproduced the PowerShell aggregates and asserted row/column counts, selection violations, eligible cancellation count and beta-contact counts.
- A separate synthetic middleware check confirmed `POST /reviews/example` reserves `generation, 30` and returns 429 when that allowance is exhausted. No real account, AI call or cloud database was used.
- Remaining limits: no live authenticated browser journey, real model generation, real-document educational audit, Firestore integration run, latency measurement or purchase. Existing tests do not cover the complete hosted recall journey or the >100-card/500-event cases. Passing tests do not validate those gaps.

## 5. Ranked roadmap

Effort is a qualitative engineering judgment, not an estimate of days. Benefits are hypotheses to validate. P0 fixes prerequisites for observing a reliable beta; P1 follows measured beta friction; P2 waits for stronger evidence.

| Recommendation | Survey evidence | Current implementation | Expected benefit | Effort and dependencies | Priority | Validation method |
|---|---|---|---|---|---|---|
| Make the existing recall path reliable | Memory 15/23; consistency 10/23 | Scheduler/cards exist; ratings consume generation budget; study-tab ratings are temporary; bounded queries miss due work | Students can complete and return to the same learning activity | Medium; review API, storage, UI, clock/retry tests | P0, first milestone | Complete/reopen a saved session after exhausting generation allowance; verify due dates and all due pages |
| Add source traceability and honest coverage checks to existing generation | Broad practice 15/23; accuracy and omissions 6/23 each; explanations/references 9/23 | Whole-text extraction but no source map or coverage audit; explanations already exist | Easier verification and fewer misleading study packs | Medium–large; page-preserving extraction, topic/concept map, schema and fixture changes | P0, bounded scope before open beta | Human audit of agreed source objectives and answer evidence; detect skipped pages and missing topics |
| Save and reopen notes/practice; recover from failures | Manageable notes 14/23; progress preference 9/23; setup concern 2/23 | Notes/results temporary; cloud practice partly saved; durable MCQ path unused | Avoid repeat generation, lost work and repeated setup | Medium; extend existing stores, resource discovery, idempotency, UI loading states | P0 | Refresh/restart resumes same IDs, answers and feedback with zero generation calls |
| Verify hosted privacy and clarify limits/onboarding | Lower-frequency setup issues; private uploads are a prerequisite, not a survey vote | Auth exists but depends on env flag; stale docs; conflicting course/pack limits | Beta evidence from a usable, private journey | Small–medium; deployed configuration check, ownership tests, copy, independent load/retry | P0 release gate | Two-account isolation; unsigned calls rejected; recover a failed reviews load; one coherent allowance description |
| Surface existing theory guidance and improve keyword feedback | Understanding 11/23; explanations/references 9/23 | Guidance already generated, not rendered; exact-match gaps | Students understand and correct mistakes | Small for guidance; medium for source-supported answer variants | P0 minimal guidance; P1 richer grading | Review one wrong MCQ, acceptable alternate gap and theory rubric against source |
| Try flexible weekly goals and a bounded session | 14/23 study ≤2 days/week; daily review selected by 6/23 | Daily due list/streak exists; no goal or session boundary | Better fit with actual routines | Small experiment, then medium implementation; reliable event history first | P1 | Observe chosen cadence and voluntary returns; compare stated preference with actual sessions |
| Improve topic progress and practice variety | Progress 9/23; repetitive concern 6/23 | Topic labels/quiz summaries and three practice formats exist | Make weakness and next action understandable | Medium; durable attempts plus verified concept IDs | P1 | Show item evidence behind weak-topic labels; check repeats versus useful spaced revisits |
| Expand courses and long/scanned-document support where beta demand proves need | 16/23 take ≥6 courses; concrete bulky-document stories | One-course cap, 60k hosted cap, no OCR | More usable course material | Medium–large; actual document mix, cost/latency data; OCR only if needed | P1 | Track blocked second-course/upload attempts and successful recovery, not hypothetical demand |
| Paid streaks, complex gamification, package policing, broad RAG and full subscriptions | Streaks 1/23; purchases untested; no direct RAG or policing question | Basic streak exists; remaining ideas absent or marketing | Unknown incremental learning or revenue value | Medium–large; validated core use and pricing first | P2 | Reconsider only after repeated requests/observed failures or real purchase evidence |

Ranking rationale: availability and trustworthy content precede retention experiments. Persistence makes the return loop possible and reduces avoidable spend. Privacy is a non-negotiable beta gate even if no respondent selected it. Weekly goals and richer progress may help, but can be tested after the underlying session is reliable. Existing streaks can remain understated; paid streaks do not merit priority over the repeated learning problems.

### P0 implementation briefs

**A. Reliable first recall and return — the first engineering milestone**

- **Student problem:** “I studied” must mean their recall response was saved and they can return; generation limits must not block saved study.
- **Proposed behaviour:** generating cards offers “Start first recall”. Both flashcard entry points use the same saved-card IDs and scheduling action. A small session has a clear end, shows the actual next interval, and distinguishes more due work from caught up.
- **Locations:** `app/hosted_access.py:5`; `app/main.py` review and flashcard routes; `app/materials.py:189–274`; `app/cloud_store.py:114–166`; `frontend/src/App.jsx:81,114,136`; `TodayRecall.jsx`; `StudyResources.jsx`.
- **Smallest useful implementation:** separate non-generation review requests from AI spend limits; reuse the existing scheduler; connect first recall to saved cards; filter/order due cards before applying a query limit and fetch subsequent batches. Use an idempotent review submission (a retry saves the same event once), rather than a second scheduler. Return the next due date from the server. Add a clear retryable loading/error state. Correct recent-progress query limits before displaying a trusted daily count.
- **Acceptance:** reviews work after AI quota exhaustion; one successful rating produces one event; repeated network submission cannot double the interval; refresh shows the same saved schedule; cards beyond the first 100 are discoverable; a 50-card batch does not falsely declare the full queue complete; 7→14-day spacing is displayed accurately. UTC versus student-local day is explicitly decided and tested (Lagos is UTC+1).
- **Meaningful test:** a synthetic hosted store with >100 cards, only later cards due; exhausted generation allowance; submit/retry once; reload; advance an injected clock to the due date. Also simulate >500 historical events. Test in both local and hosted adapters, then manually complete five cards through the actual dashboard.
- **Helping evidence:** fewer failed/duplicated reviews, successful saved-session resumes, completed first sessions and voluntary week-two returns. More clicks or a longer streak alone is not evidence of better memory.

**B. Traceable, bounded study content**

- **Student problem:** incorrect answers or missed lecture sections undermine trust and exam preparation.
- **Proposed behaviour:** each item offers a source page/slide and supporting excerpt; the pack shows represented topics and warns about unreadable or uncovered sections. Explanations tell why the key is supported. Existing theory marking points become available for self-review.
- **Locations:** `app/document_text.py:17`, `text_chunks.py:11`, `study_packs.py:28,67`, `flashcards.py:25,76`, `mcqs.py:35,92`, `practice.py:10,63,96`; storage models; `StudyResources.jsx`, `Practice.jsx`.
- **Smallest useful implementation:** preserve page/slide IDs and extraction status for a bounded text-PDF beta; build a small source topic/objective list; allocate practice across that list; validate cited locations and excerpts against extracted text. Record missing topic assignments and exact duplicates, manually audit semantic duplicates initially. Reject or clearly mark unsupported items. Keep concise notes and add drill-down evidence instead of making every explanation long. Remove “Complete material” claims.
- **Acceptance:** a mixed scanned/text file cannot be labelled fully read; every displayed source link resolves; an invalid page/unsupported excerpt fails validation; major audited objectives have items or an explicit gap; no claim of exhaustive detail coverage. Exactly one defensible MCQ answer and consistent explanation must pass a human sample check.
- **Meaningful test:** synthetic PDFs with distinct facts on first/middle/last pages, an image-only page, repeated concepts and one deliberately omitted topic. Inject a nonexistent citation and a plausible but unsupported answer. Include one long/rejected file. Automated structure checks plus human answer/source review are both required.
- **Helping evidence:** confirmed factual-error rate, unresolved major-topic omissions, and time required for students to verify an answer fall across successive pack versions. Record sample sizes and audit method; do not claim improvement without a baseline.

**C. Reopen saved study resources and recover cleanly**

- **Student problem:** returning users lose notes, practice answers and scores, or regenerate duplicated cards.
- **Proposed behaviour:** opening a lecture restores saved resources and latest attempt, with regeneration an explicit action. A failed recall endpoint does not prevent opening the library. Each failed section can be retried.
- **Locations:** `app/main.py` resource/practice/quiz routes; `app/materials.py` and `cloud_store.py:78–121`; `app/quizzes.py`; `frontend/src/App.jsx:27,48,75,114`; `frontend/src/api.js`.
- **Smallest useful implementation:** give generated resources stable IDs, owner/material associations and versions; save notes and mixed-practice attempts; add resource discovery/retrieval and load them from the dashboard. Extend the existing persistence patterns rather than add a new database. Make repeated requests reuse an existing set by default. Use the student-safe quiz response approach for mixed practice. Handle a successful 204 delete response in the API helper before connecting deletion UI.
- **Acceptance:** browser reload and backend restart preserve notes, attempts and feedback; reopening performs no AI generation; another user cannot retrieve them; failed loads are distinguishable from empty libraries; retries do not create duplicate resources. Deleting a material also removes or clearly handles its derived resources/reviews—current delete functions remove only the material record.
- **Meaningful test:** upload synthetic material, generate mocked resources, answer incorrectly, restart/reload and verify exact IDs/feedback. Retry creation, simulate a reviews API failure, verify library access, and test cross-user reads plus deletion of derived data.
- **Helping evidence:** fewer forced regenerations and lost-work reports; faster time to resume a useful study action; more return sessions on existing material. Measure latency instead of asserting the current app is slow.

**D. Hosted beta gate and honest onboarding**

- **Student problem:** private study material must stay private; course setup and limits should be understandable.
- **Locations:** `app/auth.py:20,40`, `cloud_store.py` owner checks, `hosted_access.py`, `AuthGate.jsx`, onboarding, landing pricing, README and DEPLOYMENT.
- **Smallest useful implementation:** fail closed for hosted authentication, verify actual deployed settings and owner queries, keep local-development mode explicit, remove stale shared-workspace statements once verified, and reconcile limits. Account-scope/clear onboarding drafts and stop claiming that local-only preferences personalize scheduling. Introduce no billing platform yet.
- **Acceptance/test:** anonymous hosted requests fail; two synthetic users cannot list/get/delete/review each other’s items; account switching reveals no previous profile; failed initialization can recover; explain one-course beta access consistently. Verify cloud indexes/configuration with a real isolated test deployment before volunteers upload private documents.
- **Helping evidence:** users reach upload without founder explanation, understand current limits, and isolation checks pass. Privacy is a release requirement, not a retention experiment.

## 6. A practical two-week beta

Start the clock only after the P0 minimum is ready. Recruit **8–10** from the 21 contactable volunteers who said Yes, subject to reconfirmation. Deliberately include low-frequency and frequent studiers, different course-load bands, and prior payers where willing. This is a purposive usability cohort, not a representative trial. Keep contacts outside the repository and analytics. Use actual student material with permission; use synthetic fixtures for engineering tests.

**Day 0:** obtain participation consent, record the student’s chosen study cadence and a simple baseline task on their material. Verify one upload, one pack and one saved recall session on their usual device. Record founder assistance. Let users skip unnecessary profile fields.

**Days 1–3:** observe first use, audit content and unblock genuine technical problems. Do not coach participants into artificial daily activity. Ask what they would otherwise have used and whether the notes/practice saved work.

**Days 4–7:** observe return and due reviews. Record every founder reminder/support intervention with a timestamp and reason. Collect a brief usefulness rating and a concrete example, including from non-returners. Keep reported helpfulness separate from usage.

**Days 8–14:** observe another week on the same material, test delayed recall with some equivalent unseen prompts, and interview drop-offs. An unseen prompt helps distinguish remembering a concept from recognizing a repeated question. This small uncontrolled exercise cannot establish causal learning gains. Only offer a real, clearly described paid continuation if secure payment testing is available; otherwise report payment conversion as **not measured**. Two weeks cannot establish monthly renewal.

### Measures and denominators

| Measure | Operational definition |
|---|---|
| Recruitment | Confirmed participants / contacted eligible Yes volunteers; report no responses separately. A survey Yes is not enrollment. |
| Activation | Within 48 hours of access, answer from memory, reveal and save ratings for five unique cards from the student’s own material. Activated participants / enrolled participants. Generation or account creation alone does not count. |
| Week-one return | Activated students with a meaningful saved study action on a different local calendar day during days 2–7 after activation / activated students with the full observation window. |
| Week-two return | Activated students with a meaningful saved action during days 8–14 after activation / activated students with 14 days of follow-up. Also report returned week-two / returned week-one. Use individual enrollment windows. |
| Voluntary versus prompted return | Report visits following a founder reminder within 24 hours separately; let users indicate why they returned. Product reminders, if added, form another category. The 24-hour attribution rule is a convention, not proof of causation. |
| Recall completion | Sessions with all five assigned unique cards rated / sessions started with five assigned cards. Freeze assigned IDs at start; report partial exits and technical failures. Also report unique participants completing, so one enthusiast cannot dominate. |
| Accuracy | Confirmed wrong/unsupported answers or misleading explanations / generated items audited; record severity and question type. Audit all items in each participant’s first small pack and all reported errors, but report random/systematic audit and user-reported samples separately. |
| Coverage | Audited source objectives represented by a defensible item / source objectives agreed in advance; record unrepresented major topics and unreadable pages separately. Denominator comes from the source, not the generated topic list. One represented objective does not establish all its details. |
| Usefulness | Respondents rating the tool 4–5 on a stated five-point scale / usefulness-survey respondents; also show respondents / enrolled. Ask for one task it helped and one it failed. |
| Payment | Verified completed, non-refunded purchases / participants offered the same real offer, terms and observation window. Separately report checkout starts, payment failures and refunds. No payment system available means not measured, not zero willingness to pay. |
| Reliability and speed | Failed actions / attempted actions, by upload/generate/review; time to first saved recall and time to reopen. Report medians and observed ranges for this small sample. Record file character/page counts, never lecture text in analytics. |

**Experimental decision targets, not observed results:** for a ten-person cohort, aim for at least seven activations, five voluntary week-one returners and four voluntary week-two returners; always publish actual activation-based denominators too. Investigate if fewer than 70% of started five-card sessions finish. Release requires no unresolved cross-account access issue or materially wrong/ambiguous item in the audited initial packs. Targets are practical learning triggers, not industry benchmarks or forecast conversion rates. Interview failures even if targets are met.

### Lightweight measurement using the existing stack

Extend existing Firestore review events and FastAPI actions, with the same concepts in SQLite for local tests. A small event record is enough: pseudonymous participant ID, event ID, event type, server timestamp, local timezone/day, session ID, opaque material/resource/item IDs, rating/outcome, duration, request status and build version. Record session start/assigned count/completion, generated-resource reuse, and a minimal source such as direct/product-reminder/founder-reminder/unknown. A reminder log can be maintained separately. No session replay, advertising tracker, vector database or separate warehouse is needed.

Server-side saved actions should determine activation/completion; deduplicate event IDs so network retries do not inflate them. Existing `review_events` need rating and session context. Separate self-rated recall from objectively scored answers. Use anonymous aggregate exports for analysis; do not log names, emails, phones, file names, source text, free-text answers, authentication tokens or prompts. Restrict access and set a short disclosed pilot retention period, for example 30 days for research events, then retain only aggregates. This is a proposed policy, not one already implemented.

## 7. Concepts to understand and inspect

- **Persistence:** saving data so it survives refresh/restart. A React `useState` value disappears; a database record can be loaded again. Trace `resources` in App versus `save_flashcards` to see the difference.
- **Idempotency:** retrying one action does not perform it twice. A review request with the same event ID should not double the interval or streak count.
- **Source traceability versus coverage:** traceability explains where an answer came from; coverage asks what important source content was not tested. Lexycon needs both.
- **Structural versus educational validation:** valid JSON and four distinct options do not prove an answer is true. Compare the MCQ validator with a real lecture and ask whether a second option could also be defended.
- **Cohort and denominator:** a cohort is the defined group being followed. Three past payers, 23 survey responses and ten invited beta users answer different questions and must not share a denominator accidentally.
- **Entitlements:** rules governing what a user can access. A monthly new-package allowance is different from a maximum number of saved courses. Decide the product rule before coding it.

Founder exercise: trace one flashcard from generation → saved card → first rating → due date → next visit. Compare the study-tab rating with Today’s Recall. Then inspect a lecture’s beginning, middle and end against five generated questions. Write down one missing concept and one ambiguous answer before making any code change.

## 8. Decisions to carry forward

### Five most important findings

1. Memory (15/23) and manageable notes (14/23) lead reported needs; they remain the top two in the within-limit sensitivity check.
2. Broad practice leads feature preferences (15/23); accuracy and omissions together are the biggest concern for 12/23. Source verification and honest coverage are core product work.
3. A daily-only design is unproven: 14/23 normally study at most two days weekly, although 16/23 imagine semester-long usefulness. Test flexible cadence.
4. Accounts, courses, explanations, saved cards, scheduling and a basic streak already exist. Important gaps are integration, reliability, traceability and persistence—not a missing feature catalogue.
5. Twenty-two respondents want to test, but only three report past payment and all stopped. Neither beta interest nor the ten hypothetical paid choices proves adoption, purchase or renewal.

### Three highest-priority changes

1. Repair and unify the existing first-recall/return path, including request limits, reliable due retrieval and retry-safe ratings.
2. Add source references and bounded coverage checks to existing generation, with honest extraction warnings and a human quality audit.
3. Persist and reopen notes/practice/feedback, with independent loading and retry. Hosted privacy verification is a gate across all three.

### Postpone

Paid streaks and elaborate milestones; strict PDF course-consistency policing; broad RAG/Ask My Material; advanced adaptive analytics; a full subscription system; OCR/large-document infrastructure before observing the beta’s document needs. Keep the simple existing streak secondary and improve the existing practice formats first.

### Pricing and package questions still unresolved

What a package contains; new/month versus stored/semester capacity; actual demand for second and later courses; continued access after downgrade; generation costs and sustainable limits; price versus capacity preference; seasonal use; actual purchases and renewal. The 1/5/10 proposal remains a hypothesis, and current code/copy do not implement it consistently.

### Practical first engineering milestone

**A student generates cards once, completes five saved recall actions, refreshes, and returns to the correctly scheduled cards without another generation call—even when the generation allowance is exhausted.** Start with brief A, demonstrate it using a synthetic fixture, explain the storage/retry path together, then test the hosted path before inviting volunteers.

### Assumptions to test next

Can students verify and trust the output? Do five-card sessions help them study their real material? Will they return without founder reminders? Does a weekly goal fit better than daily pressure? Can they explain corrected mistakes later? Do extra courses solve a problem they will actually pay for? Will useful exam-time usage extend beyond examinations? These are questions for the beta, not conclusions of this survey.
