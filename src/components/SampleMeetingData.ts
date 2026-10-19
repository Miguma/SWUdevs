export interface SampleMeeting {
  title: string;
  organization: string;
  meetingDate: string;
  timezone: string;
  participants: string;
  rawText: string;
}

export const SAMPLE_CEBUANO_ENGLISH_MEETING: SampleMeeting = {
  title: "SWUdevs Hackathon Logistics & Tech Sprint",
  organization: "SWUdevs Community",
  meetingDate: "2026-10-23",
  timezone: "Asia/Manila",
  participants: "Maria, Mark, Carlo, Kath, Leo, Ana",
  rawText: `[Meeting Starts: 2:00 PM - SWUdevs Room 304]
Attendees: Maria (Lead), Mark (Dev), Carlo (Design), Kath (Logistics), Leo (Backend), Ana (Comms)

Agenda: Hackathon 2026 Preparation, Venue, Posters, and Food Sponsors

1. MARKETING & POSTERS:
- Si Ana man to original assigned mag-design sa event poster. Pero busy kaayo si Ana sa midterm exams karong semanaha.
- Si Mark na lang diay ang mopuli mag-design sa poster! Mark confirmed: "Sige ako na lang tiwas sa Figma poster, submit nako ugma sa hapon."
- Carlo suggested: "Maybe we can ask Sir Alex to review the copy?" Let's verify with Sir Alex if he is free.

2. LOGISTICS & MERCHANDISE:
- Naay nag-propose ganina nga mag-order ta ug 50 ka customized physical hoodies.
- DECISION: Dili na ta mag-order ug physical hoodies kay kulang gyud ang budget. Nagkauyon ang tanan nga stickers ug digital certificates na lang ang ihatag.
- Si Kath ang mag-canvass ug print shop para sa mga ID stickers kutob October 26.

3. TECH STACK & DEPLOYMENT:
- Leo confirmed: "Ako na bahala mag-setup sa PostgreSQL database and Docker containers karong gabii."
- Urgent high priority: Someone needs to verify the campus Wi-Fi credentials with the IT department.

4. SPONSORS & FOOD (PENDING):
- Importante kaayo ang snacks para sa mga participants karong Sabado.
- Issue: Wala pa tay assigned sa pag-reach out sa local food sponsors (Jollibee / local bakery). Unassigned pa gyud ni karon.
- Open question: Pila man gyud ka snacks ang kailangan paliton para sa 40 ka participants?

5. NEXT MEETING:
- Next coordination sync will be on October 27 at 7:00 PM via Google Meet.`,
};
