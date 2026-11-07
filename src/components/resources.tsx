import { ArrowUpRight, BookOpen, Flower2, ShieldCheck, Syringe } from 'lucide-react';
const resources = [
  {
    title: 'Understanding cervical screening',
    label: 'SCREENING & PREVENTION',
    text: 'Learn about Pap and HPV tests, what screening is for, and questions to discuss with your healthcare professional.',
    source: 'Centers for Disease Control and Prevention',
    url: 'https://www.cdc.gov/cervical-cancer/screening/index.html',
    icon: ShieldCheck,
    color: 'pink',
  },
  {
    title: 'Get to know HPV vaccination',
    label: 'VACCINATION',
    text: 'Explore CDC information about HPV vaccines and talk to a clinician about what applies to you.',
    source: 'Centers for Disease Control and Prevention',
    url: 'https://www.cdc.gov/hpv/vaccines/index.html',
    icon: Syringe,
    color: 'mint',
  },
  {
    title: 'Making sense of PCOS',
    label: 'YOUR HEALTH, EXPLAINED',
    text: 'Start with the National Institutes of Health’s patient information about polycystic ovary syndrome.',
    source: 'NIH · NICHD',
    url: 'https://www.nichd.nih.gov/health/topics/pcos',
    icon: Flower2,
    color: 'lavender',
  },
  {
    title: 'Learning about uterine fibroids',
    label: 'YOUR HEALTH, EXPLAINED',
    text: 'Read original, research-based information about fibroids and prepare questions for your clinician.',
    source: 'NIH · NICHD',
    url: 'https://www.nichd.nih.gov/health/topics/uterine',
    icon: BookOpen,
    color: 'blue',
  },
];
export default function Resources() {
  return (
    <div className="resources-layout">
      <div className="resources-intro">
        <span className="eyebrow">KNOWLEDGE IS A KIND OF SELF-CARE</span>
        <h2>
          A little clarity.
          <br />A little more confidence.
        </h2>
        <p>Reliable places to learn, at your own pace. Always from the original source.</p>
      </div>
      <div className="resource-grid">
        {resources.map((r) => (
          <a
            className={`resource-card ${r.color}`}
            key={r.title}
            href={r.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="resource-icon">
              <r.icon size={25} />
            </span>
            <span className="eyebrow">{r.label}</span>
            <h3>{r.title}</h3>
            <p>{r.text}</p>
            <div>
              {r.source}
              <ArrowUpRight size={18} />
            </div>
          </a>
        ))}
      </div>
      <p className="resource-footnote">
        Educational links are for general information, not individual medical advice. External sites
        have their own privacy policies. A healthcare professional can help you understand what’s
        right for you.
      </p>
    </div>
  );
}
