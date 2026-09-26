"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

const SKILLS = [
  { name: "Candidate scoring", body: "Score interviews against a rubric from the transcript." },
  { name: "CRM field fill", body: "Map recap fields into HubSpot or Salesforce." },
  { name: "Standup digest", body: "Collapse yesterday’s blockers into a Slack digest." },
  { name: "Risk radar", body: "Flag missed commitments and slipping dates." },
];

export default function AppsPage() {
  const { pushToast } = useToast();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>AI Apps & Skills</h1>
          <p>Run structured workflows on a recap without re-transcribing audio.</p>
        </div>
      </div>
      <div className="stat-grid">
        {SKILLS.map((skill) => (
          <div key={skill.name} className="skill-card">
            <strong style={{ fontSize: 15 }}>{skill.name}</strong>
            <p>{skill.body}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pushToast({ variant: "success", title: `${skill.name} queued` })}
            >
              Run skill
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
