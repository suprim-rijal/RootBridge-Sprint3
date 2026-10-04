import { Link } from "react-router-dom";
import { Flower2, Lock, Play, RefreshCw, Sprout } from "lucide-react";
import ProgressBar from "../../components/ProgressBar.jsx";
import TrackOff from "../../components/TrackOff.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getTrack, htmlLangOf } from "../../data/curriculum.js";
import { nextLessonFor } from "../../lib/learningSummary.js";
import { moduleProgress, moduleStatus, trackProgress, useProgress } from "../../lib/progress.js";

// /learn/language and /learn/culture
// Same data shape, two different layouts:
//   language -> "trail": numbered chapters in order, like steps
//   culture  -> "atlas": topic cards to explore

const STATUS = {
  mastered: { icon: Flower2, text: "Mastered" },
  "in-progress": { icon: RefreshCw, text: "In progress" },
  available: { icon: Sprout, text: "Ready" },
  locked: { icon: Lock, text: "Locked" },
};

const ART = {
  language: "/assets/illustrations/track-language.jpg",
  culture: "/assets/illustrations/track-culture.jpg",
};

function ModuleTile({ trackId, mod, state }) {
  const status = moduleStatus(state, mod.id);
  const { icon: Icon, text } = STATUS[status];
  const progress = moduleProgress(state, mod.id);
  const content = (
    <>
      <span className="module-tile-top">
        <b>{mod.code}</b>
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="module-tile-name">{mod.title}</span>
      <small>
        {text}
        {status === "in-progress" ? ` · ${progress.done}/${progress.total}` : ""}
      </small>
    </>
  );
  if (status === "locked") {
    return (
      <span className={`module-tile ${status}`} aria-disabled="true">
        {content}
      </span>
    );
  }
  return (
    <Link to={`/learn/${trackId}/module/${mod.id}`} className={`module-tile ${status}`}>
      {content}
    </Link>
  );
}

function LanguageTrail({ track, state }) {
  return (
    <ol className="trail">
      {track.chapters.map((chapter, i) => {
        const statuses = chapter.modules.map((m) => moduleStatus(state, m.id));
        const done = statuses.every((s) => s === "mastered");
        const open = statuses.some((s) => s !== "locked");
        return (
          <li key={chapter.id} className={`trail-step ${done ? "done" : open ? "open" : "locked"}`}>
            <span className="trail-num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="trail-body">
              <h2>
                <span className="trail-code">{chapter.code}</span> {chapter.title}
                {chapter.nepaliTitle ? (
                  <span className="trail-np" lang={htmlLangOf()}>
                    {chapter.nepaliTitle}
                  </span>
                ) : null}
              </h2>
              <p className="path-muted">{chapter.summary}</p>
              {open ? (
                <ul className="tile-row">
                  {chapter.modules.map((m) => (
                    <li key={m.id}>
                      <ModuleTile trackId="language" mod={m} state={state} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="trail-locked">
                  <Lock size={13} aria-hidden="true" /> Opens after the chapter before it.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CultureAtlas({ track, state }) {
  return (
    <ul className="atlas">
      {track.chapters.map((chapter) => {
        const statuses = chapter.modules.map((m) => moduleStatus(state, m.id));
        const mastered = statuses.filter((s) => s === "mastered").length;
        const open = statuses.some((s) => s !== "locked");
        return (
          <li key={chapter.id} className={`atlas-card ${open ? "" : "locked"}`}>
            <div className="atlas-head">
              <span className="atlas-code">{chapter.code}</span>
              <span className="atlas-count">
                {mastered}/{chapter.modules.length}
              </span>
            </div>
            <h2>{chapter.title}</h2>
            <p className="path-muted">{chapter.summary}</p>
            <ul className="atlas-modules">
              {chapter.modules.map((m) => (
                <li key={m.id}>
                  <ModuleTile trackId="culture" mod={m} state={state} />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export default function PathPage({ trackId }) {
  const { learningRules } = useAuth();
  const { state } = useProgress();
  const track = getTrack(trackId);

  if (!learningRules.allowedTracks[trackId]) return <TrackOff title={track.title} />;

  const progress = trackProgress(state, trackId);
  const next = nextLessonFor(state, trackId);

  return (
    <div className={`path-page ln-${trackId}`}>
      <section className="path-hero">
        <img src={ART[trackId]} alt="" className="path-hero-art" />
        <div className="path-hero-copy">
          <p className="path-kicker">{trackId === "language" ? "Language path" : "Culture path"}</p>
          <h1>
            {track.title} <span lang={htmlLangOf()}>{track.nepaliTitle}</span>
          </h1>
          <p>{track.tagline}</p>
          <div className="path-hero-progress">
            <ProgressBar value={progress.pct} label={`${track.title} progress`} />
            <span>
              {progress.doneLessons}/{progress.lessons} lessons · {progress.mastered}/{progress.modules} modules
            </span>
          </div>
          <Link to={`/learn/${trackId}/lesson/${next.lesson.id}`} className="btn btn-track">
            <Play size={17} /> {progress.doneLessons ? "Continue" : "Start"}: {next.lesson.title}
          </Link>
        </div>
      </section>

      {trackId === "language" ? (
        <LanguageTrail track={track} state={state} />
      ) : (
        <CultureAtlas track={track} state={state} />
      )}
    </div>
  );
}
