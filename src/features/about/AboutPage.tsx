import { Logo } from '@/components/brand/Logo'
import { Card, Notice, PageHeader } from '@/components/ui'

export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader eyebrow="About" title="AduLearn — Adventure Edu Learning Platform" />
      <Card className="flex flex-col gap-4 p-6">
        <Logo />
        <p>
          AduLearn is a gamified learning prototype for Class 8 students following the Andhra Pradesh SSC curriculum. Students explore a story world, help characters, and learn by
          solving freshly generated questions with hints, explanations and adaptive difficulty.
        </p>
        <p className="text-sm text-ink-muted">Built by Team Spidey.</p>
      </Card>
      <Notice tone="warn" title="About the learning content">
        The chapters in this prototype are <strong>illustrative samples</strong> written for demonstration. They have not yet been checked against the official AP SSC Class 8
        textbooks and are not a complete curriculum. Teachers can review, approve or reject each question template in the teacher view.
      </Notice>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Privacy and your data</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
          <li>No account, real name, email, phone number or location is needed.</li>
          <li>All progress is stored only in this browser on this device (IndexedDB).</li>
          <li>Optional local AI (Ollama) runs on this computer; explorer details are not sent to it.</li>
          <li>There are no public leaderboards.</li>
        </ul>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Using AduLearn with students</h2>
        <p className="mt-2 text-ink-soft">
          Trying AduLearn with schoolchildren requires appropriate school permission, adult supervision and any applicable consent procedures. Results from this prototype describe
          observed performance only; they do not prove educational effectiveness.
        </p>
      </Card>
    </div>
  )
}
