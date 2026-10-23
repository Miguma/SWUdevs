import React from 'react';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import './style.css';

const C = {
  bg: '#f8faf8', ink: '#172b24', muted: '#5c6f66', green: '#247d59',
  pale: '#e2f0e9', border: '#e1e7e3', card: '#ffffff', amber: '#b7791f', red: '#b43a30',
};

const Icon: React.FC<{children: string}> = ({children}) => <span className="icon">{children}</span>;

const BrowserShell: React.FC<{children: React.ReactNode; section?: string}> = ({children, section}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill className="stage">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="browser" style={{opacity: interpolate(frame, [0, 12, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <div className="browser-top">
          <div className="traffic"><i/><i/><i/></div>
          <div className="address"><span>●</span> tambayayong.app</div>
          <div className="top-chip">{section ?? 'Meeting assistant'}</div>
        </div>
        <header>
          <div className="brand">tambayayong<span>.</span></div>
          <nav><span>Tool</span><span>What is this</span><span>How it works</span></nav>
        </header>
        <main>{children}</main>
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <div className="caption" style={{opacity: interpolate(frame, [4, 10, durationInFrames - 8, durationInFrames - 2], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{text}</div>;
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 24], [0.92, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1), output: 'perceptual-scale'});
  return (
    <AbsoluteFill className="intro">
      <div className="orbit one"/><div className="orbit two"/>
      <div className="intro-content" style={{scale: enter, opacity: interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'})}}>
        <div className="intro-mark">t<span>•</span></div>
        <div className="eyebrow">60-SECOND SYSTEM WALKTHROUGH</div>
        <h1>From meeting notes<br/>to a plan people can trust.</h1>
        <p>Tambayayong turns multilingual conversations into reviewed, trackable action.</p>
        <div className="language-row"><span>English</span><b>•</b><span>Cebuano</span><b>•</b><span>Tagalog</span></div>
      </div>
      <Caption text="Turn multilingual notes into a clear, reviewable action plan." />
    </AbsoluteFill>
  );
};

const NotesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const notes = [
    'Liza: Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.',
    'Jun: Mangita ko og presyo sa gloves ug mga sako.',
    'Mark: Sige, ako na ang moasikaso sa permiso.',
  ];
  return (
    <BrowserShell section="1 · Notes">
      <div className="toolbar"><span>Sign in</span><span>↶ History</span><span className="disabled">⇩ Export</span><button>＋ New meeting</button></div>
      <section className="panel notes-panel">
        <h2>Meeting notes</h2><p className="sub">Give the meeting a name, drop in your notes, and we'll draft a plan.</p>
        <label>Meeting title</label><div className="input">Community outreach planning</div>
        <div className="tabs"><b>Text</b><span>File</span><span>Sample</span></div>
        <div className="textarea">
          {notes.map((line, i) => <div key={line} style={{opacity: progress > i / notes.length ? 1 : 0.08}}>{line}</div>)}
          <div className="caret" style={{opacity: frame % 20 < 10 ? 1 : 0}}/>
        </div>
        <div className="intake-bottom"><div className="consent"><span className="check">✓</span> It's okay to send my notes to Groq to draft my plan.</div><button className="primary">Draft my action plan →</button></div>
      </section>
      <Caption text="Paste notes or upload a file. Nothing is sent without confirmation." />
    </BrowserShell>
  );
};

const AnalyzeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const step = Math.min(3, Math.floor(frame / 75));
  return (
    <BrowserShell section="2 · AI draft">
      <div className="analyze-layout">
        <div className="analyze-copy"><div className="kicker">PRIVATE BY DEFAULT</div><h2>Your notes stay yours.</h2><p>Analysis starts only after explicit confirmation. The pinned Qwen model drafts tasks, decisions, questions, owners, and dates.</p><div className="model-pill">qwen/qwen3.8-27b <span>via Groq</span></div></div>
        <div className="pipeline">
          {['Read the conversation','Extract candidate actions','Attach exact source evidence','Keep every item pending'].map((text, i) => <div className={`pipe-step ${step >= i ? 'active' : ''}`} key={text}><span>{step > i ? '✓' : i + 1}</span><div><b>{text}</b><small>{['English · Cebuano · Tagalog','No expected-answer shortcuts','Quote + line provenance','A person still decides'][i]}</small></div></div>)}
        </div>
      </div>
      <Caption text="Qwen drafts suggestions. Every new item stays pending for review." />
    </BrowserShell>
  );
};

const Task: React.FC<{title: string; meta: string; active?: boolean; approved?: boolean}> = ({title, meta, active, approved}) => (
  <div className={`task ${active ? 'active' : ''}`}><div><h4>{title}</h4><p>{meta}</p></div><div className="task-actions"><span>↗ 1 source</span><b className={approved ? 'approved' : ''}>{approved ? '☑ Approved' : '□ Approve'}</b><span>× Dismiss</span></div></div>
);

const ReviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const approve = frame > 210;
  return (
    <BrowserShell section="3 · Review">
      <div className="session"><div><b>Community Outreach Planning</b><span>Oct 19, 2026 · Tambayayong · {approve ? '5' : '4'} of 7 reviewed</span></div><span>✎ Edit notes&nbsp;&nbsp;&nbsp;＋ New</span></div>
      <section className="panel review-panel"><div className="review-head"><h2>Action items</h2><button>＋ Add task</button></div><div className="tabs compact"><b>Review 5</b><span>Tracking 3</span></div><div className="filters"><b>All 5</b><span>To review {approve ? 1 : 2}</span><span>Approved {approve ? 4 : 3}</span><span>Needs info 2</span></div>
        <div className="review-grid"><div><Task title="Finish event poster" meta="Maria · Oct 23, 2026" approved/><Task title="Bring the sound system" meta="Carlo · No date · Proposed" active approved={approve}/><Task title="Find event sponsors" meta="Unassigned · No date · Unclear"/></div><aside><div className="aside-title">Source evidence <span>Full text ↗</span></div><blockquote>“Carlo: Maybe ako magdala sa sound system, pero dili pa sure.”</blockquote><small>Oct 19, 2026 · Line 6 · Exact match</small><h5>What to check</h5><p>These words prove where the item came from. They do not prove the task, its owner, or the go-ahead.</p></aside></div>
      </section>
      <div className="cursor" style={{left: interpolate(frame, [40, 190], [1110, 690], {extrapolateRight: 'clamp'}), top: interpolate(frame, [40, 190], [650, 686], {extrapolateRight: 'clamp'}), scale: frame > 195 && frame < 220 ? 0.8 : 1}}>➤</div>
      <Caption text="Check exact source evidence, then approve, edit, or dismiss." />
    </BrowserShell>
  );
};

const TrackingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const completed = frame > 210;
  return (
    <BrowserShell section="4 · Tracking">
      <div className="session"><div><b>Community Outreach Planning</b><span>Approved work only</span></div><span>✎ Edit notes&nbsp;&nbsp;&nbsp;＋ New</span></div>
      <section className="panel review-panel"><div className="review-head"><h2>Action items</h2><span className="green-link">＋ Add task</span></div><div className="tabs compact"><span>Review 5</span><b>Tracking 3</b></div><div className="filters"><b>All 3</b><span>To do {completed ? 1 : 2}</span><span>In progress 1</span><span>Completed {completed ? 1 : 0}</span></div>
        <div className="review-grid"><div><div className="track-row active"><div><h4>Finish event poster</h4><p>Maria · Oct 23, 2026 · ↗ 1 source</p></div><strong>In progress⌄</strong></div><div className="track-row"><div><h4>Reserve barangay hall</h4><p>John · <em>Overdue · Oct 20, 2026</em></p></div><strong className={completed ? 'done' : ''}>{completed ? 'Completed ✓' : 'To do⌄'}</strong></div><div className="track-row"><div><h4>Hold the outreach event</h4><p>Team · Nov 7, 2026 · ↗ 1 source</p></div><strong>To do⌄</strong></div></div><aside><div className="aside-title">Source evidence <span>Full text ↗</span></div><blockquote>“Maria: Ako bahala sa poster. I'll finish it by October 23, 2026.”</blockquote><small>Oct 19, 2026 · Line 4 · Exact match</small><h5>Clear accountability</h5><p>Move approved actions from To do to In progress, Blocked, or Completed.</p></aside></div>
      </section>
      <Caption text="Track approved work as To do, In progress, Blocked, or Completed." />
    </BrowserShell>
  );
};

const ExportScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <BrowserShell section="5 · Share">
      <div className="share-title"><div><h2>Share your plan</h2><p>Pick the format your team uses and download it.</p></div><span>✎ Back to plan</span></div>
      <section className="panel export-panel"><div className="review-head"><h2>Export results</h2><span>▣ Copy</span></div><div className="export-grid"><button className="selected">⇩ PDF Report</button><button>▤ Actions</button><button>▧ Minutes</button><button>▥ CSV</button></div><p className="include">□ Include pending review items</p></section>
      <div className="closing" style={{opacity: interpolate(frame, [215, 250], [0, 1], {extrapolateRight: 'clamp'}), translate: `0 ${interpolate(frame, [215, 250], [20, 0], {extrapolateRight: 'clamp'})}px`}}><b>Walay mabilin.</b><span>No action left behind.</span></div>
      <Caption text="Export PDF, action list, minutes, or CSV—ready to share." />
    </BrowserShell>
  );
};

const transition = linearTiming({durationInFrames: 18});

export const TambayayongWalkthrough: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={210} premountFor={fps}><Intro/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transition}/>
        <TransitionSeries.Sequence name="Capture notes" durationInFrames={330} premountFor={fps}><NotesScene/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transition}/>
        <TransitionSeries.Sequence name="AI draft" durationInFrames={300} premountFor={fps}><AnalyzeScene/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transition}/>
        <TransitionSeries.Sequence name="Review evidence" durationInFrames={390} premountFor={fps}><ReviewScene/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transition}/>
        <TransitionSeries.Sequence name="Track work" durationInFrames={318} premountFor={fps}><TrackingScene/></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={transition}/>
        <TransitionSeries.Sequence name="Export" durationInFrames={342} premountFor={fps}><ExportScene/></TransitionSeries.Sequence>
      </TransitionSeries>
      <Sequence name="Voice-over" premountFor={fps}><Audio src={staticFile('voiceover.wav')} volume={1}/></Sequence>
    </AbsoluteFill>
  );
};
