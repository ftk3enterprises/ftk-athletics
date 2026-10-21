// Centralized configuration for values that are still TBD from the client.
// When real information arrives, update it here — nowhere else.

/** External scholarship/financial-aid link for the "Step Up" nav item. */
export const STEP_UP_URL = "https://www.stepupforstudents.org/";

export const CONTACT_EMAIL: string | null = "info@ftkathletics.com";
export const CONTACT_PHONE: string | null = "941-685-9033";
export const CONTACT_LOCATION: string | null = "Sarasota, Florida";

/**
 * Where internal notification emails (cancellation requests, sponsor
 * inquiries) actually get delivered — deliberately separate from
 * CONTACT_EMAIL, which is the public-facing address shown in the site
 * footer. Both notification routes (src/app/api/cancellation-requests,
 * src/app/api/sponsor-inquiries) import this single constant, so changing
 * the recipient only ever means editing it here.
 */
export const ADMIN_NOTIFICATION_EMAIL = "info@ftkathletics.com";
/** Primary public domain — other client-owned domains will eventually redirect here. */
export const WEBSITE_DOMAIN = "FTKAthletics.com";

/**
 * Footer social icons. `href: ""` means the platform/icon is shown but not
 * yet a live link — the client hasn't supplied the real profile URL. Fill
 * in the href here once it arrives; the footer renders a plain (non-clickable)
 * icon for any entry still blank so nothing points at a dead link.
 */
export const SOCIAL_LINKS: { platform: "facebook" | "instagram" | "twitter"; href: string }[] = [
  { platform: "facebook", href: "" },
  { platform: "instagram", href: "" },
  { platform: "twitter", href: "" },
];

export const LIABILITY_WAIVER_VERSION = "FL-Master-1.0";

// Official client-supplied waiver (FTK_Master_Waiver_Florida.docx). Verbatim —
// do not rewrite, summarize, or edit the legal text. The blank fill-in lines
// below (Participant, DOB, Signature, etc.) are reproduced as supplied; the
// registration flow's own checkbox + typed-name signature capture the actual
// electronic acceptance (see /register/waiver), consistent with Section 12's
// "electronic signature... accompanied by identifying registration
// information" acceptance method.
export const LIABILITY_WAIVER_TEXT = `FOR THE KIDS ATHLETICS, LLC
MASTER PARTICIPATION, VOLUNTEER, ASSUMPTION OF RISK, RELEASE OF LIABILITY & INDEMNIFICATION AGREEMENT

Participant / Volunteer: __________________________________________
DOB: ______________  Program/Activity: ______________________________
Natural Guardian (if minor): _______________________________________
Emergency Contact: ________________________ Phone: __________________

1. SCOPE
This master Agreement applies to all FTK sports, leagues, practices, games, camps, clinics, tournaments, training, after-school programs, homeschool PE, community and family events, athletic-development activities, volunteering, coaching, officiating, and other FTK activities at any school, park, field, gym, public or private facility, or other approved location.

2. RELEASED PARTIES
Released Parties means For The Kids Athletics, LLC (FTK), its members, founders, officers, managers, employees, coaches, officials, referees, volunteers, contractors, representatives, agents and affiliates; and, to the extent permitted by law and applicable to the activity, participating hosts, sponsors, schools, school boards, governmental entities, counties, municipalities, parks, facility and property owners/operators, lessors and licensors.

3. ASSUMPTION OF RISK
I understand that athletics and recreation involve risks that cannot be completely eliminated. I knowingly and voluntarily assume the ordinary and inherent risks of participation, volunteering, coaching, officiating, assisting, or attendance, whether known or unknown, foreseeable or unforeseeable, to the fullest extent permitted by Florida law.
• Physical contact, collisions, falls, overexertion and athletic movement.
• Uneven, wet, slippery, hard, natural, artificial, indoor or outdoor surfaces.
• Heat, humidity, dehydration, lightning, rain and other environmental conditions.
• Sprains, fractures, cuts, concussions, illness, cardiac events, paralysis, permanent disability and death.
• Acts of other participants, including negligent, aggressive or intentional conduct, altercations and fighting.
• Loss, theft, misplacement or damage of personal property.
• Risks from entering, exiting, parking at or using schools, parks, fields, gyms and surrounding premises.

4. ADULT PARTICIPANT / VOLUNTEER RELEASE
IF I AM AN ADULT PARTICIPANT, COACH, OFFICIAL, VOLUNTEER, HELPER, OR OTHER ADULT TAKING PART, I VOLUNTARILY ASSUME THE RISKS DESCRIBED ABOVE.
TO THE FULLEST EXTENT PERMITTED BY FLORIDA LAW, I RELEASE AND DISCHARGE THE RELEASED PARTIES FROM CLAIMS FOR PERSONAL INJURY, DEATH, OR PROPERTY DAMAGE ARISING FROM THE ORDINARY NEGLIGENCE OF A RELEASED PARTY OR FROM THE ORDINARY OR INHERENT RISKS OF THE ACTIVITY. I UNDERSTAND I AM GIVING UP LEGAL RIGHTS I MIGHT OTHERWISE HAVE.

5. FLORIDA STATUTORY NOTICE – MINOR PARTICIPANTS
NOTICE TO THE MINOR CHILD'S NATURAL GUARDIAN
READ THIS FORM COMPLETELY AND CAREFULLY. YOU ARE AGREEING TO LET YOUR MINOR CHILD ENGAGE IN A POTENTIALLY DANGEROUS ACTIVITY. YOU ARE AGREEING THAT, EVEN IF FOR THE KIDS ATHLETICS, LLC, ITS OWNERS, AFFILIATES, EMPLOYEES, OR AGENTS USES REASONABLE CARE IN PROVIDING THIS ACTIVITY, THERE IS A CHANCE YOUR CHILD MAY BE SERIOUSLY INJURED OR KILLED BY PARTICIPATING IN THIS ACTIVITY. BECAUSE THERE ARE CERTAIN DANGERS INHERENT IN THE ACTIVITY WHICH CANNOT BE AVOIDED OR ELIMINATED. BY SIGNING THIS FORM YOU ARE GIVING UP YOUR CHILD'S RIGHT AND YOUR RIGHT TO RECOVER FROM FOR THE KIDS ATHLETICS, LLC, ITS OWNERS, AFFILIATES, EMPLOYEES, OR AGENTS IN A LAWSUIT FOR ANY PERSONAL INJURY, INCLUDING DEATH, TO YOUR CHILD OR ANY PROPERTY DAMAGE THAT RESULTS FROM THE RISKS THAT ARE A NATURAL PART OF THE ACTIVITY. YOU HAVE THE RIGHT TO REFUSE TO SIGN THIS FORM, AND FOR THE KIDS ATHLETICS, LLC HAS THE RIGHT TO REFUSE TO LET YOUR CHILD PARTICIPATE IF YOU DO NOT SIGN THIS FORM.

6. NATURAL GUARDIAN CONSENT
If I am signing for a minor child, I represent that I am the child's natural guardian or otherwise have lawful authority to execute this Agreement. I understand that Florida law permits a natural guardian, subject to its terms and limits, to waive in advance claims arising from inherent risks of a commercial activity. I knowingly permit the minor to participate and accept those inherent risks on the minor's behalf to the extent permitted by law.

7. CONDUCT, ALTERCATIONS & REMOVAL
Participants, spectators and volunteers must follow FTK rules and reasonable directions. FTK may suspend or remove a person for fighting, threats, harassment, unsafe conduct, intoxication, deliberate rule violations, or conduct that threatens participants or property. FTK does not guarantee that another person will act safely or lawfully, and participation includes the risk that another participant may act negligently or intentionally.

8. PERSONAL PROPERTY
I am responsible for my own property and the property of any minor in my care. To the fullest extent permitted by law, the Released Parties are not responsible for ordinary loss, theft, disappearance, or damage to personal property occurring in connection with an FTK activity.

9. FACILITIES, SCHOOLS, PARKS & HOST LOCATIONS
I understand that FTK may use facilities owned or controlled by third parties. To the fullest extent permitted by law, I agree that participation in an FTK activity does not create a claim against a school, school board, county, municipality, park, facility owner/operator, host, lessor, licensor, or property owner merely because the activity occurs on that property. Any release of a third-party facility is limited to the extent permitted by applicable law and does not waive a claim that Florida law prohibits from being waived.
FTK may maintain insurance or provide evidence of insurance when required by a facility or contract. The existence of insurance does not make FTK an insurer of participants, volunteers, spectators, personal property, or third-party facilities and does not expand coverage beyond the terms of the applicable insurance policy.

10. MEDICAL AUTHORIZATION
If an injury or medical emergency occurs, I authorize FTK personnel or other responsible persons to contact emergency services and, when reasonably necessary, seek emergency evaluation or treatment. I understand FTK does not guarantee the availability of medical personnel and that I remain responsible for medical expenses except where applicable law provides otherwise.

11. INDEMNIFICATION BY ADULT SIGNER
To the fullest extent permitted by Florida law, an adult signer agrees to defend, indemnify, and hold harmless FTK from third-party claims, damages, or expenses caused by that signer's own negligent, reckless, intentional, or unlawful conduct, or by the signer's material violation of FTK rules. This provision is not intended to require a signer to indemnify a Released Party for liability that cannot lawfully be shifted or waived.

12. ELECTRONIC / PAPER SIGNATURE; SEVERABILITY
I agree that an electronic signature, electronic acceptance, checkbox acceptance accompanied by identifying registration information, or handwritten signature may evidence my agreement. If any provision is held unenforceable, the remaining provisions shall remain effective to the fullest extent permitted by law.

13. GOVERNING LAW & VENUE
This Agreement shall be interpreted under Florida law. Subject to any mandatory law to the contrary, disputes relating to this Agreement shall be brought in a court of competent jurisdiction in or serving Sarasota County, Florida.

14. ACKNOWLEDGMENT
I HAVE READ THIS AGREEMENT COMPLETELY. I UNDERSTAND THAT IT CONTAINS AN ASSUMPTION OF RISK AND RELEASE OF LIABILITY AND THAT, BY SIGNING, I MAY BE GIVING UP SUBSTANTIAL LEGAL RIGHTS. I SIGN VOLUNTARILY.

Select one:  ☐ Adult Participant   ☐ Adult Volunteer/Coach/Official   ☐ Natural Guardian of Minor
Printed Name of Signer: _________________________________________________
Signature: __________________________________________  Date: ______________
Minor Participant Name (if applicable): ___________________________________
Electronic Acceptance Record / Registration ID (if applicable): __________________`;
