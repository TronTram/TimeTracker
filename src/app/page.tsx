export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Cursor Time Tracker
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          A focused time tracking application with Pomodoro technique support.
          Track your productivity, manage projects, and achieve your goals.
        </p>
        <div className="flex gap-4">
          <button className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors">
            Get Started
          </button>
          <button className="rounded-lg border border-border px-6 py-3 hover:bg-accent hover:text-accent-foreground transition-colors">
            Learn More
          </button>
        </div>
      </div>
      
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">🍅</div>
          <h3 className="mb-2 text-xl font-semibold">Pomodoro Timer</h3>
          <p className="text-muted-foreground">
            Customizable work and break intervals to maximize your focus and productivity.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">📊</div>
          <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Detailed insights into your productivity patterns and time usage.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">🎯</div>
          <h3 className="mb-2 text-xl font-semibold">Project Management</h3>
          <p className="text-muted-foreground">
            Organize your work with projects, tags, and detailed time tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
